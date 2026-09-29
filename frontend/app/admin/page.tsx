"use client";

import { useEffect, useState } from "react";
import { getStoredUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import AppLayout from "@/components/AppLayout";

interface StatItem {
  _id: string;
  count: number;
}

interface Stats {
  totalIncidents: number;
  categoryStats: StatItem[];
  severityStats: StatItem[];
  statusStats: StatItem[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899"];

export default function AdminDashboard() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const storedUser = getStoredUser();

    if (!storedUser) {
      router.push("/login");
      return;
    }

    if (storedUser.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    setUser(storedUser);

    const token = localStorage.getItem("token");

    api
      .get("/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setStats(res.data))
      .catch(() => setError("Failed to load stats"));
  }, [router]);

  if (!user) {
    return null;
  }

  const isDark = mounted && resolvedTheme === "dark";
  const gridColor = isDark ? "#404040" : "#e5e5e5";
  const axisColor = isDark ? "#a3a3a3" : "#525252";
  const tooltipBg = isDark ? "#171717" : "#ffffff";
  const tooltipBorder = isDark ? "#404040" : "#e5e5e5";

  return (
    <AppLayout userRole={user.role}>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Analytics Overview</h1>
          <Button
            onClick={() => router.push("/admin/incidents")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Manage Incidents
          </Button>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {!stats ? (
          <p className="text-muted-foreground">Loading stats...</p>
        ) : (
          <>
            <div className="bg-card border border-border rounded-xl p-6 mb-6">
              <p className="text-muted-foreground text-sm">Total Incidents</p>
              <p className="text-4xl font-bold mt-1">{stats.totalIncidents}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Incidents by Category
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.categoryStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="_id" stroke={axisColor} />
                    <YAxis stroke={axisColor} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: tooltipBg,
                        border: `1px solid ${tooltipBorder}`,
                      }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Incidents by Severity
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.severityStats}
                      dataKey="count"
                      nameKey="_id"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {stats.severityStats.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: tooltipBg,
                        border: `1px solid ${tooltipBorder}`,
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}