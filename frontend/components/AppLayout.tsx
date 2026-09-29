"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import PushPermissionBanner from "./PushPermissionBanner";
import { socket } from "@/lib/socket";
import { getStoredUser } from "@/lib/auth";

interface AppLayoutProps {
  children: React.ReactNode;
  userRole?: string;
}

export default function AppLayout({ children, userRole }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        setCollapsed((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      socket.emit("joinUserRoom", storedUser.id);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar
        userRole={userRole}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      <div
        className={`min-h-screen transition-all duration-200 ${
          collapsed ? "ml-16" : "ml-64"
        }`}
      >
        <div className="px-4 pt-4">
          <PushPermissionBanner />
        </div>
        {children}
      </div>
    </div>
  );
}