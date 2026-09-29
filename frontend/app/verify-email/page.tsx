"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import api from "@/lib/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    api
      .get(`/auth/verify-email?token=${token}`)
      .then((res) => {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        setStatus("success");
        setMessage("Your email has been verified. Redirecting...");

        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(
          err.response?.data?.message ||
            "Verification failed. Please try again."
        );
      });
  }, [token, router]);

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-neutral-950 text-neutral-100 relative overflow-hidden px-4">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px]" />

      <div className="relative w-full max-w-sm text-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          <ShieldCheck className="w-7 h-7 text-blue-500" />
          <span className="text-xl font-semibold tracking-tight">
            SafeCity
          </span>
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-8">
          {status === "loading" && (
            <>
              <Loader2 className="w-10 h-10 text-blue-500 mx-auto mb-4 animate-spin" />
              <p className="text-neutral-300">Verifying your email...</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
              <h1 className="text-lg font-semibold mb-2">Email Verified!</h1>
              <p className="text-sm text-neutral-400">{message}</p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
              <h1 className="text-lg font-semibold mb-2">
                Verification Failed
              </h1>
              <p className="text-sm text-neutral-400">{message}</p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}