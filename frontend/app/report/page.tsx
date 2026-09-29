"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  ArrowLeft,
  ImagePlus,
  Video,
  X,
  Circle,
  Square,
  Upload,
} from "lucide-react";
import api from "@/lib/api";
import AppLayout from "@/components/AppLayout";
import { getStoredUser } from "@/lib/auth";
import VoiceInput from "@/components/VoiceInput";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const categories = [
  "Theft",
  "Accident",
  "Harassment",
  "Infrastructure",
  "Fire",
  "Other",
];

type LocationStatus = "idle" | "loading" | "done" | "error";
type MediaTab = "photo" | "video";

export default function Report() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [user, setUser] = useState<User | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [mediaTab, setMediaTab] = useState<MediaTab>("photo");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      router.push("/login");
      return;
    }
    setUser(storedUser);
  }, [router]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, []);

  const getLocation = () => {
    setLocationStatus("loading");
    if (!navigator.geolocation) {
      setLocationStatus("error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus("done");
      },
      () => setLocationStatus("error")
    );
  };

  const removeMedia = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const switchTab = (tab: MediaTab) => {
    removeMedia();
    setMediaTab(tab);
    setError("");
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setError("File must be under 20MB");
      return;
    }
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setError("File must be under 20MB");
      return;
    }
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setError("");
  };

  const startRecording = async () => {
    try {
      setError("");
      setIsRecording(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;

      setTimeout(() => {
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
          videoPreviewRef.current.muted = true;
          videoPreviewRef.current
            .play()
            .catch((err) => console.error("Play error:", err));
        }
      }, 100);
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, {
        mimeType: "video/webm",
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const file = new File([blob], `recording-${Date.now()}.webm`, {
          type: "video/webm",
        });
        setMediaFile(file);
        setMediaPreview(URL.createObjectURL(blob));

        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);

      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((prev) => {
          if (prev >= 30) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      setError(
        "Could not access camera/microphone. Please allow permissions."
      );
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!coords) {
      setError("Please share your location before submitting");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      let mediaUrl: string | undefined = undefined;
      let mediaTypeResult: string | undefined = undefined;

      if (mediaFile) {
        setUploadingMedia(true);
        const formData = new FormData();
        formData.append("file", mediaFile);

        const uploadRes = await api.post("/upload", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });

        mediaUrl = uploadRes.data.mediaUrl;
        mediaTypeResult = uploadRes.data.mediaType;
        setUploadingMedia(false);
      }

      const res = await api.post(
        "/incidents",
        {
          title,
          description,
          category,
          longitude: coords.lng,
          latitude: coords.lat,
          mediaUrl,
          mediaType: mediaTypeResult,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(
        res.data.possibleDuplicate
          ? `Reported! Note: ${res.data.similarIncidentsCount} similar incident(s) already exist nearby.`
          : "Incident reported successfully!"
      );

      setTitle("");
      setDescription("");
      setCategory("");
      setCoords(null);
      setLocationStatus("idle");
      removeMedia();

      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.errors?.[0] ||
        err.response?.data?.message ||
        "Something went wrong. Please try again."
      );
      setUploadingMedia(false);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <AppLayout userRole={user.role}>
      <div className="p-8 max-w-lg mx-auto">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <h1 className="text-2xl font-semibold mb-1">Report an Incident</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Help make your neighborhood safer by reporting what you see
        </p>

        <div className="bg-card border border-border rounded-xl p-8 backdrop-blur-sm">
          {error && (
            <div className="mb-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-md px-3 py-2">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-900 rounded-md px-3 py-2">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title" className="text-foreground">Title</Label>
              <Input
                id="title"
                placeholder="Streetlight not working"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-blue-600 h-11"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="category" className="text-foreground">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
                <SelectTrigger className="bg-background border-border text-foreground h-11 w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description" className="text-foreground">Description</Label>
              <div className="relative">
                <Textarea
                  id="description"
                  placeholder="Describe what happened..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-blue-600 pr-12"
                />
                <VoiceInput
                  onResult={(text) =>
                    setDescription((prev) => (prev ? `${prev} ${text}` : text))
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Evidence (optional)</Label>

              <div className="flex gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => switchTab("photo")}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-sm py-2 rounded-lg border transition-colors ${mediaTab === "photo"
                    ? "border-blue-600 bg-blue-600/10 text-blue-600 dark:text-blue-400"
                    : "border-border bg-background text-muted-foreground"
                    }`}
                >
                  <ImagePlus className="w-3.5 h-3.5" />
                  Photo
                </button>
                <button
                  type="button"
                  onClick={() => switchTab("video")}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-sm py-2 rounded-lg border transition-colors ${mediaTab === "video"
                    ? "border-blue-600 bg-blue-600/10 text-blue-600 dark:text-blue-400"
                    : "border-border bg-background text-muted-foreground"
                    }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  Video
                </button>
              </div>

              {mediaPreview ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
                  {mediaTab === "photo" ? (
                    <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <video src={mediaPreview} controls className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={removeMedia}
                    className="absolute top-2 right-2 bg-background/80 hover:bg-accent text-foreground rounded-full p-1.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : isRecording ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-red-800 bg-black">
                  <video
                    ref={videoPreviewRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded-full">
                    <Circle className="w-2.5 h-2.5 fill-red-500 text-red-500 animate-pulse" />
                    <span className="text-xs text-white">{recordSeconds}s / 30s</span>
                  </div>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-red-600 hover:bg-red-700 text-white rounded-full p-3"
                  >
                    <Square className="w-4 h-4 fill-white" />
                  </button>
                </div>
              ) : mediaTab === "photo" ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-lg h-32 text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors"
                >
                  <ImagePlus className="w-6 h-6" />
                  <span className="text-sm">Click to add a photo</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={startRecording}
                    className="flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-lg h-32 text-muted-foreground hover:border-red-800 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  >
                    <Circle className="w-6 h-6" />
                    <span className="text-sm">Record video</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-lg h-32 text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors"
                  >
                    <Upload className="w-6 h-6" />
                    <span className="text-sm">Upload video</span>
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm"
                onChange={handleVideoFileSelect}
                className="hidden"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Location</Label>
              <Button
                type="button"
                onClick={getLocation}
                variant="outline"
                className="border-border bg-background hover:bg-accent text-foreground h-11 justify-start"
              >
                <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                {locationStatus === "idle" && "Share my current location"}
                {locationStatus === "loading" && "Getting location..."}
                {locationStatus === "done" &&
                  coords &&
                  `Location captured (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`}
                {locationStatus === "error" && "Failed to get location — try again"}
              </Button>
            </div>

            <Button
              type="submit"
              disabled={loading || isRecording}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white h-11 disabled:opacity-60"
            >
              {uploadingMedia
                ? "Uploading media..."
                : loading
                  ? "Submitting..."
                  : "Submit Report"}
            </Button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}