"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, User, Mail, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";

export default function Signup() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.post("/auth/signup", { name, email, password });
      router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      const message =
        err.response?.data?.errors?.[0] ||
        err.response?.data?.message ||
        "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-background text-foreground relative overflow-hidden px-4">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/25 dark:bg-blue-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="w-7 h-7 text-blue-500" />
            <span className="text-xl font-semibold tracking-tight">
              SafeCity
            </span>
          </div>
          <h1 className="text-2xl font-semibold">Create an account</h1>
          <p className="text-muted-foreground text-sm mt-1 text-center">
            Sign up to start reporting incidents in your area
          </p>
        </div>

        <div className="bg-card/70 border border-border rounded-xl p-8 backdrop-blur-md shadow-xl shadow-black/5 dark:shadow-black/40">
          {error && (
            <div className="mb-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-start gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 rounded-md px-3 py-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name" className="text-foreground">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="pl-9 bg-background/60 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-blue-600 h-11"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-9 bg-background/60 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-blue-600 h-11"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-9 pr-9 bg-background/60 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-blue-600 h-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white h-11 disabled:opacity-60 shadow-md shadow-blue-600/20"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>
        </div>

        <p className="text-sm text-muted-foreground mt-6 text-center">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400">
            Log in
          </a>
        </p>
      </div>
    </main>
  );
}