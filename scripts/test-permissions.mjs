/**
 * Permission regression suite for SECURITY DEFINER RPC functions.
 *
 * Verifies the intended access matrix after any auth/RLS change:
 *
 *   Function                        anon     authenticated
 *   get_parent_view_data            ALLOW    ALLOW   (token-gated parent share link)
 *   get_agent_rating_aggregates     DENY     ALLOW   (marketplace aggregates)
 *   update_updated_at_column        DENY     DENY    (trigger-only helper)
 *   prevent_share_token_change      DENY     DENY    (trigger-only helper)
 *
 * Usage:
 *   node scripts/test-permissions.mjs
 *
 * Optional env (for authenticated-role checks):
 *   SUPABASE_TEST_TOKEN   a user access token (JWT). Without it, authenticated
 *                         checks are skipped and reported as SKIP.
 *
 * Exit code 0 = all executed checks passed, 1 = at least one failed.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  try {
    const text = readFileSync(join(root, ".env"), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]+)"?\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {
    /* .env optional if vars already in environment */
  }
}
loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const USER_TOKEN = process.env.SUPABASE_TEST_TOKEN || null;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY");
  process.exit(1);
}

// PGRST202/404 = function not exposed via RPC at all (e.g. trigger-only helpers
// with no JSON-compatible signature) — also counts as denied for API callers.
const DENY_MARKERS = ["permission denied", "42501", "PGRST301", "PGRST202", "not allowed"];

async function callRpc(fn, args, token) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  const body = await res.text();
  return { status: res.status, body };
}

function isDenied({ status, body }) {
  if (status === 200) return false;
  return (
    DENY_MARKERS.some((m) => body.includes(m)) ||
    status === 401 ||
    status === 403 ||
    status === 404
  );
}

const cases = [
  {
    fn: "get_parent_view_data",
    args: { _token: "a".repeat(32) }, // valid format, nonexistent token -> returns null
    anon: "allow",
    auth: "allow",
    note: "token-gated parent share link",
  },
  {
    fn: "get_agent_rating_aggregates",
    args: { _agent_ids: [] },
    anon: "deny",
    auth: "allow",
    note: "marketplace aggregates, signed-in only",
  },
  {
    fn: "update_updated_at_column",
    args: {},
    anon: "deny",
    auth: "deny",
    note: "trigger-only helper",
  },
  {
    fn: "prevent_share_token_change",
    args: {},
    anon: "deny",
    auth: "deny",
    note: "trigger-only helper",
  },
];

let failures = 0;
let skips = 0;

async function runCase(c, role, token, expected) {
  const label = `${role.padEnd(13)} ${c.fn}`;
  const res = await callRpc(c.fn, c.args, token);
  const denied = isDenied(res);
  const ok = expected === "allow" ? !denied && res.status === 200 : denied;
  if (!ok) failures++;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${label}  expected=${expected}  status=${res.status}` +
      (ok ? "" : `  body=${res.body.slice(0, 200)}`)
  );
}

console.log(`Permission regression suite -> ${SUPABASE_URL}\n`);

for (const c of cases) {
  await runCase(c, "anon", ANON_KEY, c.anon);
  if (USER_TOKEN) {
    await runCase(c, "authenticated", USER_TOKEN, c.auth);
  } else {
    skips++;
    console.log(`SKIP  authenticated  ${c.fn}  (set SUPABASE_TEST_TOKEN to enable)`);
  }
}

console.log(
  `\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}` +
    (skips ? ` (${skips} authenticated checks skipped)` : "")
);
process.exit(failures === 0 ? 0 : 1);
