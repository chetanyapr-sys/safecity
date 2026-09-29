"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, Lock, Eye, EyeOff, Wand2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

function generateStrongPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "!@#$%&*";
  const all = upper + lower + numbers + symbols;

  let password =
    upper[Math.floor(Math.random() * upper.length)] +
    lower[Math.floor(Math.random() * lower.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    symbols[Math.floor(Math.random() * symbols.length)];

  for (let i = 0; i < 8; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleGeneratePassword = () => {
    const generated = generateStrongPassword();
    setNewPassword(generated);
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Please enter all 6 digits of the code");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/reset-password", {
        email,
        otp: otpValue,
        newPassword,
      });
      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong");
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
          <h1 className="text-2xl font-semibold">Set new password</h1>
          <p className="text-muted-foreground text-sm mt-1 text-center">
            Enter the code sent to <span className="text-foreground">{email}</span>
          </p>
        </div>

        <div className="bg-card/70 border border-border rounded-xl p-8 backdrop-blur-md shadow-xl shadow-black/5 dark:shadow-black/40">
          {error && (
            <div className="mb-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 rounded-md px-3 py-2">
              <CheckCircle2 className="w-4 h-4" />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <Label className="text-foreground mb-2 block">Reset Code</Label>
              <div className="flex justify-between gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-10 h-12 text-center text-lg font-semibold bg-background/60 border border-border rounded-lg text-foreground outline-none focus:ring-2 focus:ring-blue-600"
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="newPassword" className="text-foreground">
                  New Password
                </Label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400"
                >
                  <Wand2 className="w-3 h-3" />
                  Generate strong password
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="pl-9 pr-9 bg-background/60 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-blue-600 h-11 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPassword && (
                <p className="text-xs text-muted-foreground">
                  {newPassword.length < 6
                    ? "Too short — at least 6 characters"
                    : newPassword.length < 10
                    ? "Decent password"
                    : "Strong password"}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white h-11 disabled:opacity-60 shadow-md shadow-blue-600/20"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}