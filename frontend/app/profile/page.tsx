"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getStoredUser } from "@/lib/auth";
import {
  User as UserIcon,
  Mail,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronRight,
} from "lucide-react";
import api from "@/lib/api";
import AppLayout from "@/components/AppLayout";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Incident {
  _id: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  createdAt: string;
  verifiedBy: string[];
}

const severityStyles: Record<string, string> = {
  Critical: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900",
  High: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-900",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-900",
  Low: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900",
};

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

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [myIncidents, setMyIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const storedUser = getStoredUser();

    if (!storedUser) {
      router.push("/login");
      return;
    }

      setUser(storedUser);

      const token = localStorage.getItem("token");

      api
        .get("/incidents/user/mine", {
          headers: { Authorization: `Bearer ${token}` },
        })
      .then((res) => setMyIncidents(res.data.incidents))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [router]);

  if (!user) {
    return null;
  }

  const resolvedCount = myIncidents.filter((i) => i.status === "Resolved").length;
  const verifiedCount = myIncidents.filter((i) => i.status === "Verified").length;
  const totalVerificationsGiven = myIncidents.reduce(
    (sum, i) => sum + i.verifiedBy.length,
    0
  );
  const recentActivity = myIncidents.slice(0, 6);

  return (
    <AppLayout userRole={user.role}>
      <div className="p-8">
        <h1 className="text-2xl font-semibold mb-6">Profile</h1>

        <div className="grid lg:grid-cols-[340px_1fr] gap-6">
          <div className="flex flex-col gap-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-blue-600/15 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-3xl font-semibold text-blue-600 dark:text-blue-400 mb-3">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-lg font-semibold">{user.name}</h2>
                <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 mt-2">
                  <ShieldCheck className="w-3 h-3" />
                  {user.role}
                </span>
              </div>

              <div className="flex flex-col gap-3 border-t border-border pt-4">
                <div className="flex items-center gap-3 text-sm">
                  <UserIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Full Name</span>
                  <span className="ml-auto text-foreground truncate">
                    {user.name}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Email</span>
                  <span className="ml-auto text-foreground truncate">
                    {user.email}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 mx-auto mb-1.5" />
                <p className="text-xl font-bold">
                  {loading ? "-" : myIncidents.length}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Reports</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto mb-1.5" />
                <p className="text-xl font-bold">
                  {loading ? "-" : resolvedCount}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Resolved</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <ShieldCheck className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mx-auto mb-1.5" />
                <p className="text-xl font-bold">
                  {loading ? "-" : verifiedCount}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Verified</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-sm text-muted-foreground mb-1">
                Community Impact
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {loading ? "-" : totalVerificationsGiven}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Verifications received across all your reports
              </p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              {myIncidents.length > 0 && (
                <Link
                  href="/my-reports"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                >
                  View all
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 rounded-lg bg-muted/60 animate-pulse"
                  />
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="w-10 h-10 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground font-medium">
                  No activity yet
                </p>
                <Link
                  href="/report"
                  className="text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 text-sm mt-2"
                >
                  Report your first incident
                </Link>
              </div>
            ) : (
              <div className="flex flex-col">
                {recentActivity.map((incident, index) => (
                  <Link
                    key={incident._id}
                    href={`/incidents/${incident._id}`}
                    className={`flex items-center justify-between gap-4 py-3.5 hover:bg-accent/50 -mx-2 px-2 rounded-lg transition-colors ${
                      index !== recentActivity.length - 1
                        ? "border-b border-border"
                        : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {incident.title}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {incident.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(incident.createdAt)}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${severityStyles[incident.severity]}`}
                    >
                      {incident.severity}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}