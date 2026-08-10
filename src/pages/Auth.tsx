import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import TurnstileCaptcha from "@/components/TurnstileCaptcha";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const MAX_ATTEMPTS = 5;
const CAPTCHA_THRESHOLD = 3; // Show CAPTCHA after this many failed attempts
const LOCKOUT_DURATION = 60000; // 1 minute in ms

const Auth = () => {
  const [searchParams] = useSearchParams();
  const rawNext = searchParams.get("next");
  const nextPath = rawNext && /^\/(?!\/)/.test(rawNext) ? rawNext : "/";
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [remainingLockout, setRemainingLockout] = useState(0);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const isLockedOut = lockoutUntil !== null && Date.now() < lockoutUntil;
  const requiresCaptcha = isLogin && !isForgotPassword && failedAttempts >= CAPTCHA_THRESHOLD && !captchaVerified;

  // Update remaining lockout time
  useEffect(() => {
    if (!lockoutUntil) return;
    
    const interval = setInterval(() => {
      const remaining = Math.max(0, lockoutUntil - Date.now());
      setRemainingLockout(Math.ceil(remaining / 1000));
      
      if (remaining <= 0) {
        setLockoutUntil(null);
        setFailedAttempts(0);
        setCaptchaVerified(false);
        setCaptchaToken(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutUntil]);

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const validateInputs = () => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
      return false;
    }
  };

  const handleCaptchaVerify = useCallback(async (token: string) => {
    setCaptchaToken(token);
    
    try {
      const response = await supabase.functions.invoke("verify-turnstile", {
        body: { token },
      });

      if (response.data?.success) {
        setCaptchaVerified(true);
        toast.success("Verification successful! You can now sign in.");
      } else {
        toast.error("CAPTCHA verification failed. Please try again.");
        setCaptchaToken(null);
      }
    } catch (error) {
      toast.error("Failed to verify CAPTCHA. Please try again.");
      setCaptchaToken(null);
    }
  }, []);

  const handleCaptchaExpire = useCallback(() => {
    setCaptchaToken(null);
    setCaptchaVerified(false);
    toast.info("CAPTCHA expired. Please complete it again.");
  }, []);

  const handleFailedLogin = useCallback(() => {
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);
    
    if (newAttempts >= MAX_ATTEMPTS) {
      const lockoutEnd = Date.now() + LOCKOUT_DURATION;
      setLockoutUntil(lockoutEnd);
      toast.error(`Too many failed attempts. Please wait 1 minute before trying again.`);
    } else if (newAttempts >= CAPTCHA_THRESHOLD) {
      toast.error(`Invalid credentials. Please complete the CAPTCHA to continue.`);
    } else {
      const remaining = CAPTCHA_THRESHOLD - newAttempts;
      toast.error(`Invalid email or password. ${remaining} attempt${remaining === 1 ? '' : 's'} before CAPTCHA required.`);
    }
  }, [failedAttempts]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Password reset link sent! Check your email.");
      setIsForgotPassword(false);
    } catch (error) {
      toast.error("Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLockedOut) {
      toast.error(`Please wait ${remainingLockout} seconds before trying again.`);
      return;
    }

    if (requiresCaptcha) {
      toast.error("Please complete the CAPTCHA verification first.");
      return;
    }
    
    if (!validateInputs()) return;

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            handleFailedLogin();
            // Reset captcha verification on failed login
            setCaptchaVerified(false);
            setCaptchaToken(null);
          } else {
            toast.error(error.message);
          }
          return;
        }

        // Reset on successful login
        setFailedAttempts(0);
        setLockoutUntil(null);
        setCaptchaVerified(false);
        setCaptchaToken(null);
        toast.success("Welcome back!");
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) {
          if (error.message.includes("User already registered")) {
            toast.error("An account with this email already exists");
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success("Account created successfully!");
        navigate("/");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      toast.error("Failed to sign in with Google. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center shadow-card mb-4">
            <BookOpen className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">StudyBuddy</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your AI Career Guide & Study Mentor
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-6 text-center">
            {isForgotPassword ? "Reset Password" : isLogin ? "Welcome Back" : "Create Account"}
          </h2>

          {isForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <p className="text-sm text-muted-foreground">
                Enter your email and we'll send you a link to reset your password.
              </p>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Send Reset Link
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  className="text-sm text-primary hover:underline"
                  disabled={loading}
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                {isLogin && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-sm text-primary hover:underline"
                      disabled={loading}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {requiresCaptcha && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground text-center">
                      Please verify you're human to continue
                    </p>
                    <TurnstileCaptcha
                      onVerify={handleCaptchaVerify}
                      onExpire={handleCaptchaExpire}
                      onError={() => toast.error("CAPTCHA error. Please refresh and try again.")}
                    />
                  </div>
                )}

                {isLockedOut && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                    <span>Too many attempts. Try again in {remainingLockout}s</span>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading || isLockedOut || requiresCaptcha}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isLockedOut ? `Locked (${remainingLockout}s)` : isLogin ? "Sign In" : "Sign Up"}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                  or continue with
                </span>
              </div>

              {/* Google OAuth Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={handleGoogleSignIn}
                disabled={loading || isLockedOut}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-primary hover:underline"
                  disabled={loading}
                >
                  {isLogin
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Sign in"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
