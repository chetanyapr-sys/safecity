"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import api from "@/lib/api";
import { socket } from "@/lib/socket";

interface Comment {
  _id: string;
  text: string;
  user: { _id: string; name: string };
  createdAt: string;
}

interface CommentSectionProps {
  incidentId: string;
}

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

export default function CommentSection({ incidentId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    api
      .get(`/comments/${incidentId}`)
      .then((res) => setComments(res.data.comments))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [incidentId]);

  useEffect(() => {
    const handleNewComment = (data: {
      incidentId: string;
      comment: Comment;
    }) => {
      if (data.incidentId === incidentId) {
        setComments((prev) => [...prev, data.comment]);
      }
    };

    socket.on("newComment", handleNewComment);
    return () => {
      socket.off("newComment", handleNewComment);
    };
  }, [incidentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setPosting(true);
    const token = localStorage.getItem("token");

    try {
      await api.post(
        `/comments/${incidentId}`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setText("");
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="text-sm font-medium text-muted-foreground mb-4">
        Discussion ({comments.length})
      </h2>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          maxLength={500}
          className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-blue-600"
        />
        <button
          type="submit"
          disabled={posting || !text.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg px-4 flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-lg bg-muted/60 animate-pulse"
            />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No comments yet. Be the first to say something.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {comments.map((comment) => (
            <div key={comment._id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600/15 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-xs font-semibold text-blue-600 dark:text-blue-400 shrink-0">
                {comment.user?.name?.charAt(0).toUpperCase() || "?"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {comment.user?.name || "Unknown"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 mt-0.5">
                  {comment.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}