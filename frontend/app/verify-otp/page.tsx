"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

function VerifyOtpForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    pasted.split("").forEach((digit, i) => {
      newOtp[i] = digit;
    });
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/verify-otp", {
        email,
        otp: otpValue,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setSuccess("Verified! Redirecting...");
      setTimeout(() => router.push("/dashboard"), 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Verification failed");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    try {
      await api.post("/auth/resend-otp", { email });
      setCooldown(30);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResending(false);
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
            <span className="text-xl font-semibold tracking-tight">
              SafeCity
            </span>
          </div>
          <h1 className="text-2xl font-semibold">Verify your email</h1>
          <p className="text-muted-foreground text-sm mt-1 text-center">
            Enter the 6-digit code sent to
            <br />
            <span className="text-foreground">{email}</span>
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

          <div className="flex justify-between gap-2 mb-6">
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
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-11 h-13 text-center text-lg font-semibold bg-background/60 border border-border rounded-lg text-foreground outline-none focus:ring-2 focus:ring-blue-600"
              />
            ))}
          </div>

          <Button
            onClick={handleVerify}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 disabled:opacity-60 shadow-md shadow-blue-600/20"
          >
            {loading ? "Verifying..." : "Verify Email"}
          </Button>

          <div className="text-center mt-4">
            <button
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="text-sm text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 disabled:text-muted-foreground disabled:cursor-not-allowed"
            >
              {cooldown > 0
                ? `Resend code in ${cooldown}s`
                : resending
                ? "Sending..."
                : "Didn't get a code? Resend"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function VerifyOtp() {
  return (
    <Suspense fallback={null}>
      <VerifyOtpForm />
    </Suspense>
  );
}