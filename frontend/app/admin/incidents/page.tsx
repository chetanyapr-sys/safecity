"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Star,
    MessageSquare,
    Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import AppLayout from "@/components/AppLayout";

interface Incident {
    _id: string;
    title: string;
    category: string;
    severity: string;
    status: string;
    isPriority: boolean;
    assignedDepartment: string;
    createdAt: string;
    reportedBy?: { name: string; email: string };
    internalNotes: { text: string; addedAt: string }[];
}

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

const statusStyles: Record<string, string> = {
    Pending: "bg-muted text-muted-foreground",
    Verified: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
    Resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
    Rejected: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

const departments = [
    "Unassigned",
    "Police",
    "Fire Department",
    "Municipal Corporation",
    "Traffic Police",
];

export default function AdminIncidentManagement() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<string[]>([]);
    const [statusFilter, setStatusFilter] = useState("");

    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogAction, setDialogAction] = useState<{
        ids: string[];
        status: string;
    } | null>(null);
    const [note, setNote] = useState("");
    const [noteDialogId, setNoteDialogId] = useState<string | null>(null);
    const [noteText, setNoteText] = useState("");

    const fetchIncidents = () => {
        const token = localStorage.getItem("token");
        const query = statusFilter ? `?status=${statusFilter}` : "";
        api
            .get(`/admin/incidents${query}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => setIncidents(res.data.incidents))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        const storedUser = getStoredUser();
        if (
            !storedUser ||
            (storedUser.role !== "admin" && storedUser.role !== "moderator")
        ) {
            router.push("/dashboard");
            return;
        }
        setUser(storedUser);
        fetchIncidents();
    }, [router, statusFilter]);

    const toggleSelect = (id: string) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
        );
    };

    const openStatusDialog = (ids: string[], status: string) => {
        setDialogAction({ ids, status });
        setNote("");
        setDialogOpen(true);
    };

    const confirmStatusChange = async () => {
        if (!dialogAction) return;
        const token = localStorage.getItem("token");

        try {
            if (dialogAction.ids.length === 1) {
                await api.patch(
                    `/admin/incidents/${dialogAction.ids[0]}/status`,
                    { status: dialogAction.status, note },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } else {
                await api.post(
                    `/admin/incidents/bulk-status`,
                    { ids: dialogAction.ids, status: dialogAction.status, note },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }
            setDialogOpen(false);
            setSelected([]);
            fetchIncidents();
        } catch (err) {
            console.error(err);
        }
    };

    const togglePriority = async (id: string) => {
        const token = localStorage.getItem("token");
        await api.patch(
            `/admin/incidents/${id}/priority`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        );
        fetchIncidents();
    };

    const assignDepartment = async (id: string, department: string) => {
        const token = localStorage.getItem("token");
        await api.patch(
            `/admin/incidents/${id}/assign`,
            { department },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        fetchIncidents();
    };

    const submitNote = async () => {
        if (!noteDialogId || !noteText.trim()) return;
        const token = localStorage.getItem("token");
        await api.post(
            `/admin/incidents/${noteDialogId}/notes`,
            { text: noteText },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        setNoteDialogId(null);
        setNoteText("");
        fetchIncidents();
    };

    if (!user) return null;

    return (
        <AppLayout userRole={user.role}>
            <div className="p-8">
                <h1 className="text-2xl font-semibold mb-6">Manage Incidents</h1>

                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Select
                            value={statusFilter}
                            onValueChange={(value) => setStatusFilter(value ?? "")}
                        >
                            <SelectTrigger className="bg-background border-border text-foreground w-48">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border text-popover-foreground">
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Verified">Verified</SelectItem>
                                <SelectItem value="Resolved">Resolved</SelectItem>
                                <SelectItem value="Rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {selected.length > 0 && (
                        <div className="flex items-center gap-2 bg-blue-600/10 border border-blue-200 dark:border-blue-900 rounded-lg px-4 py-2">
                            <span className="text-sm text-blue-700 dark:text-blue-300">
                                {selected.length} selected
                            </span>
                            <Button
                                size="sm"
                                onClick={() => openStatusDialog(selected, "Resolved")}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white h-8"
                            >
                                Resolve
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => openStatusDialog(selected, "Rejected")}
                                className="bg-red-600 hover:bg-red-700 text-white h-8"
                            >
                                Reject
                            </Button>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="flex flex-col gap-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-20 rounded-xl bg-card border border-border animate-pulse"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {incidents.map((incident) => (
                            <div
                                key={incident._id}
                                className={`bg-card border rounded-xl p-4 ${incident.isPriority
                                    ? "border-yellow-400 dark:border-yellow-800"
                                    : "border-border"
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        checked={selected.includes(incident._id)}
                                        onCheckedChange={() => toggleSelect(incident._id)}
                                        className="mt-1"
                                    />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Link
                                                href={`/incidents/${incident._id}`}
                                                className="font-medium hover:underline"
                                            >
                                                {incident.title}
                                            </Link>
                                            {incident.isPriority && (
                                                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                            )}
                                            <span
                                                className={`text-xs px-2 py-0.5 rounded-full ${statusStyles[incident.status]}`}
                                            >
                                                {incident.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {incident.category} · Reported by{" "}
                                            {incident.reportedBy?.name || "Unknown"} ·{" "}
                                            {new Date(incident.createdAt).toLocaleDateString()}
                                        </p>

                                        {incident.internalNotes.length > 0 && (
                                            <div className="mt-2 bg-background border border-border rounded-lg p-2">
                                                <p className="text-[11px] text-muted-foreground mb-1">
                                                    Internal Notes:
                                                </p>
                                                {incident.internalNotes.map((n, i) => (
                                                    <p key={i} className="text-xs text-muted-foreground">
                                                        {n.text}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <Select
                                            value={incident.assignedDepartment}
                                            onValueChange={(val) =>
                                                assignDepartment(incident._id, val ?? "Unassigned")
                                            }
                                        >
                                            <SelectTrigger className="bg-background border-border text-foreground h-8 text-xs w-40">
                                                <Building2 className="w-3 h-3 mr-1" />
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border-border text-popover-foreground">
                                                {departments.map((d) => (
                                                    <SelectItem key={d} value={d}>
                                                        {d}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <button
                                            onClick={() => togglePriority(incident._id)}
                                            className={`p-2 rounded-lg border ${incident.isPriority
                                                ? "border-yellow-400 dark:border-yellow-800 bg-yellow-100 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400"
                                                : "border-border bg-background text-muted-foreground"
                                                }`}
                                            title="Toggle priority"
                                        >
                                            <Star className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={() => setNoteDialogId(incident._id)}
                                            className="p-2 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground"
                                            title="Add internal note"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                        </button>

                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                openStatusDialog([incident._id], "Resolved")
                                            }
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                                        >
                                            Resolve
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                openStatusDialog([incident._id], "Rejected")
                                            }
                                            variant="outline"
                                            className="border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-950 text-red-600 dark:text-red-400 h-8 text-xs"
                                        >
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="bg-popover border-border text-popover-foreground">
                    <DialogHeader>
                        <DialogTitle>
                            Mark {dialogAction?.ids.length} incident(s) as{" "}
                            {dialogAction?.status}
                        </DialogTitle>
                    </DialogHeader>
                    <Textarea
                        placeholder="Add a reason/note (optional)..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="bg-background border-border text-foreground"
                    />
                    <DialogFooter>
                        <Button
                            onClick={confirmStatusChange}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!noteDialogId}
                onOpenChange={(open) => !open && setNoteDialogId(null)}
            >
                <DialogContent className="bg-popover border-border text-popover-foreground">
                    <DialogHeader>
                        <DialogTitle>Add Internal Note</DialogTitle>
                    </DialogHeader>
                    <Textarea
                        placeholder="This note is only visible to admins..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        className="bg-background border-border text-foreground"
                    />
                    <DialogFooter>
                        <Button
                            onClick={submitNote}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Add Note
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}