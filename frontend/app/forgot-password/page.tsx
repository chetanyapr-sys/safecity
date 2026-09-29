"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/forgot-password", { email });
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-background text-foreground relative overflow-hidden px-4">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/25 dark:bg-blue-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="w-7 h-7 text-blue-500" />
            <span className="text-xl font-semibold tracking-tight">SafeCity</span>
          </div>
          <h1 className="text-2xl font-semibold">Reset your password</h1>
          <p className="text-muted-foreground text-sm mt-1 text-center">
            Enter your email and we&apos;ll send you a reset code
          </p>
        </div>

        <div className="bg-card/70 border border-border rounded-xl p-8 backdrop-blur-md shadow-xl shadow-black/5 dark:shadow-black/40">
          {error && (
            <div className="mb-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
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

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 disabled:opacity-60 shadow-md shadow-blue-600/20"
            >
              {loading ? "Sending..." : "Send Reset Code"}
            </Button>
          </form>

          <a
            href="/login"
            className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mt-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Login
          </a>
        </div>
      </div>
    </main>
  );
}