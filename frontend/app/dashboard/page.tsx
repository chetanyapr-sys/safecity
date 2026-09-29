"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import api from "@/lib/api";
import { socket } from "@/lib/socket";
import AppLayout from "@/components/AppLayout";
import { getStoredUser } from "@/lib/auth";

interface Incident {
  _id: string;
  title: string;
  category: string;
  severity: string;
  location: {
    coordinates: [number, number];
  };
}

interface IncidentMapProps {
  incidents: Incident[];
}

const IncidentMap = dynamic<IncidentMapProps>(
  () => import("@/components/IncidentMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        Loading map...
      </div>
    ),
  }
);

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [liveNotice, setLiveNotice] = useState("");

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
      .catch((err) => console.error("Failed to fetch incidents:", err));
  }, [router]);

  useEffect(() => {
    socket.on("newIncident", (incident: Incident) => {
      setIncidents((prev) => [incident, ...prev]);
      setLiveNotice(`New incident reported: ${incident.title}`);

      setTimeout(() => setLiveNotice(""), 4000);
    });

    return () => {
      socket.off("newIncident");
    };
  }, []);

  if (!user) {
    return null;
  }

  const recentIncidents = incidents.slice(0, 5);

  return (
    <AppLayout userRole={user.role}>
      <div className="p-8">
        <h1 className="text-2xl font-semibold mb-2">
          Welcome, {user.name} 👋
        </h1>
        <p className="text-muted-foreground mb-6">
          Role: <span className="text-blue-500 dark:text-blue-400">{user.role}</span>
        </p>

        {liveNotice && (
          <div className="mb-4 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 rounded-md px-3 py-2 animate-pulse">
            🔴 Live: {liveNotice}
          </div>
        )}

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-muted-foreground text-sm">Total Incidents</p>
            <p className="text-3xl font-bold mt-1">{incidents.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-muted-foreground text-sm">Critical</p>
            <p className="text-3xl font-bold mt-1 text-red-600 dark:text-red-400">
              {incidents.filter((i) => i.severity === "Critical").length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-muted-foreground text-sm">High</p>
            <p className="text-3xl font-bold mt-1 text-orange-600 dark:text-orange-400">
              {incidents.filter((i) => i.severity === "High").length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-muted-foreground text-sm">Low</p>
            <p className="text-3xl font-bold mt-1 text-green-600 dark:text-green-400">
              {incidents.filter((i) => i.severity === "Low").length}
            </p>
          </div>
        </div>

        <div className="h-[400px] rounded-lg overflow-hidden border border-border mb-6">
          <IncidentMap incidents={incidents} />
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Incidents</h2>
          <div className="flex flex-col gap-3">
            {recentIncidents.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No incidents reported yet.
              </p>
            ) : (
              recentIncidents.map((incident) => (
                <div
                  key={incident._id}
                  className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{incident.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {incident.category}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      incident.severity === "Critical"
                        ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                        : incident.severity === "High"
                        ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400"
                        : incident.severity === "Medium"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"
                        : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                    }`}
                  >
                    {incident.severity}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}