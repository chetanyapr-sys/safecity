"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Layers } from "lucide-react";
import api from "@/lib/api";
import { socket } from "@/lib/socket";
import AppLayout from "@/components/AppLayout";
import { getStoredUser } from "@/lib/auth";

interface Incident {
  _id: string;
  title: string;
  category: string;
  severity: string;
  location: { coordinates: [number, number] };
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

const categories = ["Theft", "Accident", "Harassment", "Infrastructure", "Fire", "Other"];
const severities = ["Low", "Medium", "High", "Critical"];

const categoryColors: Record<string, string> = {
  Theft: "bg-purple-500",
  Accident: "bg-orange-500",
  Harassment: "bg-pink-500",
  Infrastructure: "bg-blue-500",
  Fire: "bg-red-500",
  Other: "bg-neutral-500",
};

export default function MapView() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeCategories, setActiveCategories] = useState<string[]>(categories);
  const [activeSeverities, setActiveSeverities] = useState<string[]>(severities);
  const [showPanel, setShowPanel] = useState(true);

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
      .catch((err) => console.error(err));
  }, [router]);

  useEffect(() => {
    socket.on("newIncident", (incident: Incident) => {
      setIncidents((prev) => [incident, ...prev]);
    });

    return () => {
      socket.off("newIncident");
    };
  }, []);

  const toggleCategory = (cat: string) => {
    setActiveCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleSeverity = (sev: string) => {
    setActiveSeverities((prev) =>
      prev.includes(sev) ? prev.filter((s) => s !== sev) : [...prev, sev]
    );
  };

  const filteredIncidents = useMemo(() => {
    return incidents.filter(
      (i) =>
        activeCategories.includes(i.category) &&
        activeSeverities.includes(i.severity)
    );
  }, [incidents, activeCategories, activeSeverities]);

  if (!user) {
    return null;
  }

  return (
    <AppLayout userRole={user.role}>
      <div className="relative h-screen">
        <div className="absolute top-4 left-4 z-[500]">
          <button
            onClick={() => setShowPanel(!showPanel)}
            className="flex items-center gap-2 bg-card/90 backdrop-blur border border-border text-foreground text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg hover:bg-accent transition-colors"
          >
            <Layers className="w-4 h-4" />
            Layers
          </button>

          {showPanel && (
            <div className="mt-2 bg-card/95 backdrop-blur border border-border rounded-lg shadow-xl p-4 w-64">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Categories
              </p>
              <div className="flex flex-col gap-2 mb-4">
                {categories.map((cat) => (
                  <label
                    key={cat}
                    className="flex items-center gap-2 text-sm text-foreground cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={activeCategories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                      className="accent-blue-600"
                    />
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${categoryColors[cat]}`}
                    />
                    {cat}
                  </label>
                ))}
              </div>

              <p className="text-xs font-medium text-muted-foreground mb-2">
                Severity
              </p>
              <div className="flex flex-col gap-2">
                {severities.map((sev) => (
                  <label
                    key={sev}
                    className="flex items-center gap-2 text-sm text-foreground cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={activeSeverities.includes(sev)}
                      onChange={() => toggleSeverity(sev)}
                      className="accent-blue-600"
                    />
                    {sev}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="absolute top-4 right-4 z-[500] bg-card/90 backdrop-blur border border-border rounded-lg shadow-lg px-4 py-2.5">
          <p className="text-sm text-foreground">
            <span className="font-semibold">{filteredIncidents.length}</span>{" "}
            <span className="text-muted-foreground">
              of {incidents.length} incidents
            </span>
          </p>
        </div>

        <IncidentMap incidents={filteredIncidents} />
      </div>
    </AppLayout>
  );
}