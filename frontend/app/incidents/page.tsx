"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  MapPin,
  Clock,
  ShieldAlert,
  Filter,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { socket } from "@/lib/socket";
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
  location: { coordinates: [number, number] };
  reportedBy?: { name: string };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const categories = ["Theft", "Accident", "Harassment", "Infrastructure", "Fire", "Other"];
const severities = ["Low", "Medium", "High", "Critical"];
const statuses = ["Pending", "Verified", "Resolved", "Rejected"];

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
  Rejected: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
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

export default function IncidentsFeed() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const storedUser = getStoredUser();

    if (!storedUser) {
      router.push("/login");
      return;
    }

    setUser(storedUser);

    api
      .get("/incidents")
      .then((res) => setIncidents(res.data.incidents))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    socket.on("newIncident", (incident: Incident) => {
      setIncidents((prev) => [incident, ...prev]);
    });

    return () => {
      socket.off("newIncident");
    };
  }, []);

  const filteredIncidents = useMemo(() => {
    return (incidents || []).filter((incident) => {
      const matchesSearch =
        search.trim() === "" ||
        incident.title.toLowerCase().includes(search.toLowerCase()) ||
        incident.description.toLowerCase().includes(search.toLowerCase());

      const matchesCategory = !category || incident.category === category;
      const matchesSeverity = !severity || incident.severity === severity;
      const matchesStatus = !status || incident.status === status;

      return matchesSearch && matchesCategory && matchesSeverity && matchesStatus;
    });
  }, [incidents, search, category, severity, status]);

  const activeFilterCount = [category, severity, status].filter(Boolean).length;

  const clearFilters = () => {
    setCategory("");
    setSeverity("");
    setStatus("");
  };

  if (!user) {
    return null;
  }

  return (
    <AppLayout userRole={user.role}>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Incidents Feed</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {filteredIncidents.length} of {(incidents || []).length} incidents
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search incidents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-blue-600 h-11"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 h-11 rounded-md border text-sm font-medium transition-colors ${
              showFilters || activeFilterCount > 0
                ? "border-blue-600 bg-blue-600/10 text-blue-600 dark:text-blue-400"
                : "border-border bg-background text-foreground hover:bg-accent"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="bg-card border border-border rounded-xl p-5 mb-6 flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-background border border-border text-foreground text-sm rounded-md px-3 py-2 min-w-[160px] outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="bg-background border border-border text-foreground text-sm rounded-md px-3 py-2 min-w-[160px] outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">All Severities</option>
                {severities.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-background border border-border text-foreground text-sm rounded-md px-3 py-2 min-w-[160px] outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">All Statuses</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-3 py-2"
              >
                <X className="w-3.5 h-3.5" />
                Clear filters
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-40 rounded-xl bg-card border border-border animate-pulse"
              />
            ))}
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShieldAlert className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-medium">No incidents found</p>
            <p className="text-muted-foreground/70 text-sm mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIncidents.map((incident) => (
              <Link
                key={incident._id}
                href={`/incidents/${incident._id}`}
                className="bg-card border border-border rounded-xl p-5 hover:border-foreground/20 hover:bg-accent/50 transition-colors flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium leading-snug">{incident.title}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${severityStyles[incident.severity]}`}
                  >
                    {incident.severity}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {incident.description}
                </p>

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {incident.category}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {timeAgo(incident.createdAt)}
                  </span>
                </div>

                <span
                  className={`text-xs px-2 py-1 rounded-md self-start ${statusStyles[incident.status]}`}
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