"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  CheckCheck,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import api from "@/lib/api";
import { socket } from "@/lib/socket";

interface Notification {
  _id: string;
  message: string;
  type: string;
  relatedIncident?: string;
  read: boolean;
  createdAt: string;
}

type Tab = "all" | "unread";

const PANEL_WIDTH = 384;

function timeAgo(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function TypeIcon({ type }: { type: string }) {
  const base = "w-4 h-4";
  if (type === "verification")
    return <ShieldCheck className={`${base} text-emerald-500`} />;
  if (type === "status_change")
    return <RefreshCw className={`${base} text-blue-500`} />;
  if (type === "comment")
    return <MessageSquare className={`${base} text-purple-500`} />;
  return <Bell className={`${base} text-muted-foreground`} />;
}

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("all");
  const [pos, setPos] = useState({ top: 12, left: 12 });
  const [toast, setToast] = useState<{ id: string; message: string } | null>(
    null
  );

  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const visible =
    tab === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const fetchNotifications = () => {
    api
      .get("/notifications", authHeaders())
      .then((res) => setNotifications(res.data.notifications))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handler = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setToast({ id: notification._id, message: notification.message });
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 5000);
    };

    socket.on("newNotification", handler);
    return () => {
      socket.off("newNotification", handler);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const width = Math.min(PANEL_WIDTH, window.innerWidth - 24);
    const left = Math.max(
      12,
      Math.min(rect.right + 12, window.innerWidth - width - 12)
    );
    setPos({ top: 12, left });
  };

  useEffect(() => {
    if (!open) return;

    updatePosition();

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      )
        return;
      setOpen(false);
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    window.addEventListener("resize", updatePosition);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  const markAllRead = async () => {
    try {
      await api.post("/notifications/mark-read", {}, authHeaders());
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const clearAll = async () => {
    try {
      await api.delete("/notifications", authHeaders());
      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.read) {
      setNotifications((prev) =>
        prev.map((x) => (x._id === n._id ? { ...x, read: true } : x))
      );
      api
        .post(`/notifications/${n._id}/read`, {}, authHeaders())
        .catch((err) => console.error(err));
    }
    setOpen(false);
    if (n.relatedIncident) router.push(`/incidents/${n.relatedIncident}`);
  };

  const panel = open ? (
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        width: Math.min(PANEL_WIDTH, window.innerWidth - 24),
      }}
      className="z-[60] flex max-h-[80vh] flex-col overflow-hidden rounded-xl border border-border bg-popover shadow-2xl shadow-black/20 dark:shadow-black/50"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-popover-foreground">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
              {unreadCount} new
            </span>
          )}
        </div>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs + actions */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex gap-1">
          {(["all", "unread"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                tab === t
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
          <button
            onClick={clearAll}
            disabled={notifications.length === 0}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <BellOff className="h-8 w-8 opacity-50" />
            <p className="text-sm">
              {tab === "unread" ? "You're all caught up" : "No notifications yet"}
            </p>
          </div>
        ) : (
          visible.map((n) => (
            <button
              key={n._id}
              onClick={() => handleNotificationClick(n)}
              className={`flex w-full items-start gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-accent/60 ${
                n.read ? "" : "bg-blue-500/5"
              }`}
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <TypeIcon type={n.type} />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`break-words text-sm ${
                    n.read
                      ? "text-muted-foreground"
                      : "font-medium text-popover-foreground"
                  }`}
                >
                  {n.message}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {timeAgo(n.createdAt)}
                </p>
              </div>
              {!n.read && (
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  ) : null;

  const toastEl = toast ? (
    <div className="fixed right-4 top-4 z-[70] flex max-w-sm items-start gap-3 rounded-xl border border-border bg-popover px-4 py-3 shadow-2xl shadow-black/20 dark:shadow-black/50">
      <Bell className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
      <p className="flex-1 break-words text-sm text-popover-foreground">
        {toast.message}
      </p>
      <button
        onClick={() => setToast(null)}
        aria-label="Dismiss"
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative rounded-lg p-2 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <>
            {panel}
            {toastEl}
          </>,
          document.body
        )}
    </>
  );
}