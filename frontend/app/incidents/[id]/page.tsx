"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { getStoredUser } from "@/lib/auth";
import CommentSection from "@/components/CommentSection";
import {
  ArrowLeft,
  MapPin,
  Clock,
  User as UserIcon,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import AppLayout from "@/components/AppLayout";

interface Incident {
  _id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  createdAt: string;
  location: { coordinates: [number, number] };
  reportedBy?: { _id: string; name: string; email: string };
  verifiedBy: string[];
  mediaUrl?: string;
  mediaType?: "image" | "video";
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface IncidentMapProps {
  incidents: {
    _id: string;
    title: string;
    category: string;
    severity: string;
    location: { coordinates: [number, number] };
  }[];
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

const severityStyles: Record<string, string> = {
  Critical: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900",
  High: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-900",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-900",
  Low: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900",
};

export default function IncidentDetail() {
  const router = useRouter();
  const params = useParams();
  const incidentId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  const fetchIncident = () => {
    api
      .get(`/incidents/${incidentId}`)
      .then((res) => setIncident(res.data.incident))
      .catch(() => setIncident(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const storedUser = getStoredUser();

    if (!storedUser) {
      router.push("/login");
      return;
    }

    setUser(storedUser);
    fetchIncident();
  }, [router, incidentId]);

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyError("");
    const token = localStorage.getItem("token");

    try {
      await api.post(
        `/incidents/${incidentId}/verify`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchIncident();
    } catch (err: any) {
      setVerifyError(
        err.response?.data?.message || "Failed to verify incident"
      );
    } finally {
      setVerifying(false);
    }
  };

  if (!user) {
    return null;
  }

  const alreadyVerified =
    incident && user
      ? incident.verifiedBy.some((id) => id === user.id)
      : false;

  const isOwnReport =
    incident && user
      ? (typeof incident.reportedBy === "string"
        ? incident.reportedBy
        : incident.reportedBy?._id) === user.id
      : false;

  return (
    <AppLayout userRole={user.role}>
      <div className="p-8 max-w-3xl mx-auto">
        <button
          onClick={() => router.push("/incidents")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Incidents
        </button>

        {loading ? (
          <div className="space-y-4">
            <div className="h-8 w-2/3 bg-muted rounded animate-pulse" />
            <div className="h-32 bg-muted rounded animate-pulse" />
            <div className="h-64 bg-muted rounded animate-pulse" />
          </div>
        ) : !incident ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Incident not found.</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-2xl font-semibold">{incident.title}</h1>
              <span
                className={`text-xs px-2.5 py-1 rounded-full border shrink-0 ${severityStyles[incident.severity]}`}
              >
                {incident.severity}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {incident.category}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {new Date(incident.createdAt).toLocaleString()}
              </span>
              {incident.reportedBy && (
                <span className="flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5" />
                  {incident.reportedBy.name}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                {incident.status}
              </span>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 mb-6">
              <h2 className="text-sm font-medium text-muted-foreground mb-2">
                Description
              </h2>
              <p className="text-foreground leading-relaxed">
                {incident.description}
              </p>
            </div>

            {incident.mediaUrl && (
              <div className="rounded-xl overflow-hidden border border-border mb-6">
                {incident.mediaType === "video" ? (
                  <video
                    src={incident.mediaUrl}
                    controls
                    className="w-full max-h-96 bg-black"
                  />
                ) : (
                  <img
                    src={incident.mediaUrl}
                    alt={incident.title}
                    className="w-full max-h-96 object-cover"
                  />
                )}
              </div>
            )}

            <div className="h-[300px] rounded-xl overflow-hidden border border-border mb-6">
              <IncidentMap incidents={[incident]} />
            </div>

            <div className="bg-card border border-border rounded-xl p-6 flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {incident.verifiedBy.length} verification
                  {incident.verifiedBy.length !== 1 && "s"}
                </p>
                <p className="text-sm text-muted-foreground">
                  3 verifications auto-mark this incident as Verified
                </p>
                {verifyError && (
                  <p className="text-sm text-red-500 dark:text-red-400 mt-1">{verifyError}</p>
                )}
              </div>

              {!isOwnReport && (
                <Button
                  onClick={handleVerify}
                  disabled={verifying || alreadyVerified}
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {alreadyVerified
                    ? "Verified"
                    : verifying
                      ? "Verifying..."
                      : "Verify Incident"}
                </Button>
              )}
            </div>

            <div className="mt-6">
              <CommentSection incidentId={incidentId} />
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}