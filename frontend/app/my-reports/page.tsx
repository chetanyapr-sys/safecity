"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Clock, MapPin } from "lucide-react";
import api from "@/lib/api";
import AppLayout from "@/components/AppLayout";
import { getStoredUser } from "@/lib/auth";

interface Incident {
  _id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  createdAt: string;
  verifiedBy: string[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const severityStyles: Record<string, string> = {
  Critical: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900",
  High: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-900",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-900",
  Low: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900",
};

const statusStyles: Record<string, string> = {
  Pending: "bg-muted text-muted-foreground",
  Verified: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  Resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
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

export default function MyReports() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
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
      .then((res) => setIncidents(res.data.incidents))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [router]);

  if (!user) {
    return null;
  }

  return (
    <AppLayout userRole={user.role}>
      <div className="p-8">
        <h1 className="text-2xl font-semibold mb-1">My Reports</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Incidents you've reported and their current status
        </p>

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-card border border-border animate-pulse"
              />
            ))}
          </div>
        ) : incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-medium">
              You haven't reported any incidents yet
            </p>
            <Link
              href="/report"
              className="text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 text-sm mt-2"
            >
              Report your first incident
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {incidents.map((incident) => (
              <Link
                key={incident._id}
                href={`/incidents/${incident._id}`}
                className="bg-card border border-border rounded-xl p-5 hover:border-foreground/20 hover:bg-accent/50 transition-colors flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">{incident.title}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${severityStyles[incident.severity]}`}
                    >
                      {incident.severity}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {incident.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(incident.createdAt)}
                    </span>
                    <span>
                      {incident.verifiedBy.length} verification
                      {incident.verifiedBy.length !== 1 && "s"}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-xs px-2.5 py-1 rounded-md shrink-0 ${statusStyles[incident.status]}`}
                >
                  {incident.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}