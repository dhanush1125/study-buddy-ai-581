import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 60000; // 1 minute in ms

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [remainingLockout, setRemainingLockout] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  const isLockedOut = lockoutUntil !== null && Date.now() < lockoutUntil;

  // Update remaining lockout time
  useEffect(() => {
    if (!lockoutUntil) return;
    
    const interval = setInterval(() => {
      const remaining = Math.max(0, lockoutUntil - Date.now());
      setRemainingLockout(Math.ceil(remaining / 1000));
      
      if (remaining <= 0) {
        setLockoutUntil(null);
        setFailedAttempts(0);
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

  const handleFailedLogin = useCallback(() => {
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);
    
    if (newAttempts >= MAX_ATTEMPTS) {
      const lockoutEnd = Date.now() + LOCKOUT_DURATION;
      setLockoutUntil(lockoutEnd);
      toast.error(`Too many failed attempts. Please wait 1 minute before trying again.`);
    } else {
      const remaining = MAX_ATTEMPTS - newAttempts;
      toast.error(`Invalid email or password. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
    }
  }, [failedAttempts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLockedOut) {
      toast.error(`Please wait ${remainingLockout} seconds before trying again.`);
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
          } else {
            toast.error(error.message);
          }
          return;
        }

        // Reset on successful login
        setFailedAttempts(0);
        setLockoutUntil(null);
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
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>

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

            {isLockedOut && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>Too many attempts. Try again in {remainingLockout}s</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading || isLockedOut}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isLockedOut ? `Locked (${remainingLockout}s)` : isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </form>

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
        </div>
      </div>
    </div>
  );
};

export default Auth;
