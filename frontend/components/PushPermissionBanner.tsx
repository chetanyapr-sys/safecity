"use client";

import { useEffect, useState } from "react";
import { subscribeToPush } from "@/lib/pushNotifications";
import { getStoredUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function PushPermissionBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      const dismissed = localStorage.getItem("pushBannerDismissed");
      if (!dismissed) setVisible(true);
    }
  }, []);

  const handleEnable = async () => {
    console.log("Enable clicked!");
    const user = getStoredUser();
    const token = localStorage.getItem("token");
    console.log("user:", user);
    console.log("token:", token);

    if (!user || !token) {
      console.log("STOPPED: user ya token missing hai");
      return;
    }

    console.log("Calling subscribeToPush...");
    try {
      const result = await subscribeToPush(process.env.NEXT_PUBLIC_API_URL as string, token);
      console.log("subscribeToPush result:", result);
    } catch (err) {
      console.error("subscribeToPush ERROR:", err);
    }
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("pushBannerDismissed", "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm">
      <span className="text-foreground">
        Get notified instantly when your reports are updated — even when the tab is closed.
      </span>
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" onClick={handleEnable}>Enable</Button>
        <button onClick={handleDismiss} aria-label="Dismiss">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}