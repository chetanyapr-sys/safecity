"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldCheck,
  LayoutDashboard,
  List,
  Map,
  FileText,
  User,
  BarChart3,
  ShieldAlert,
  LogOut,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Trophy,
} from "lucide-react";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";

interface SidebarProps {
  userRole?: string;
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Incidents Feed", href: "/incidents", icon: List },
  { label: "Map View", href: "/map", icon: Map },
  { label: "My Reports", href: "/my-reports", icon: FileText },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { label: "Profile", href: "/profile", icon: User },
];

export default function Sidebar({
  userRole,
  collapsed,
  setCollapsed,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <aside
      className={`h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col fixed left-0 top-0 transition-all duration-200 z-40 ${collapsed ? "w-16" : "w-64"
        }`}
    >
      <div className="flex items-center justify-between px-4 py-5 border-b border-sidebar-border">
        {!collapsed ? (
          <>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-blue-500 shrink-0" />
              <span className="text-lg font-semibold">SafeCity</span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NotificationBell />
              <button
                onClick={() => setCollapsed(true)}
                className="text-sidebar-foreground/60 hover:text-sidebar-foreground group relative"
              >
                <PanelLeftClose className="w-4.5 h-4.5" />
                <span className="absolute left-1/2 -translate-x-1/2 top-8 whitespace-nowrap bg-popover text-popover-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Collapse (Ctrl+B)
                </span>
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={() => setCollapsed(false)}
            className="mx-auto text-sidebar-foreground/60 hover:text-sidebar-foreground group relative"
          >
            <PanelLeftOpen className="w-5 h-5" />
            <span className="absolute left-1/2 -translate-x-1/2 top-8 whitespace-nowrap bg-popover text-popover-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Expand (Ctrl+B)
            </span>
          </button>
        )}
      </div>

      <div className="px-3 pt-4">
        <Link
          href="/report"
          className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg py-2.5 transition-colors justify-center group relative`}
        >
          <Plus className="w-4 h-4 shrink-0" />
          {!collapsed && "Report Incident"}
          {collapsed && (
            <span className="absolute left-full ml-2 whitespace-nowrap bg-popover text-popover-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Report Incident
            </span>
          )}
        </Link>
      </div>

      <nav className="flex-1 px-3 py-6 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative ${collapsed ? "justify-center" : ""
                } ${isActive
                  ? "bg-blue-600/15 text-blue-400"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && item.label}
              {collapsed && (
                <span className="absolute left-full ml-2 whitespace-nowrap bg-popover text-popover-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}

        {(userRole === "admin" || userRole === "moderator") && (
          <Link
            href="/admin/incidents"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative ${collapsed ? "justify-center" : ""
              } ${pathname === "/admin/incidents"
                ? "bg-blue-600/15 text-blue-400"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            {!collapsed && "Manage Incidents"}
            {collapsed && (
              <span className="absolute left-full ml-2 whitespace-nowrap bg-popover text-popover-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                Manage Incidents
              </span>
            )}
          </Link>
        )}

        {userRole === "admin" && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative ${collapsed ? "justify-center" : ""
              } ${pathname === "/admin"
                ? "bg-blue-600/15 text-blue-400"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            {!collapsed && "Admin Analytics"}
            {collapsed && (
              <span className="absolute left-full ml-2 whitespace-nowrap bg-popover text-popover-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                Admin Analytics
              </span>
            )}
          </Link>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent w-full transition-colors group relative ${collapsed ? "justify-center" : ""
            }`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && "Logout"}
          {collapsed && (
            <span className="absolute left-full ml-2 whitespace-nowrap bg-popover text-popover-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              Logout
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}