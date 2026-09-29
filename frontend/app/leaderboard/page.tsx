"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, Medal, Award, TrendingUp, Target } from "lucide-react";
import api from "@/lib/api";
import AppLayout from "@/components/AppLayout";
import { getStoredUser } from "@/lib/auth";

interface LeaderboardEntry {
  id: string;
  name: string;
  points: number;
  reportCount: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const rankStyles = [
  {
    icon: Trophy,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-gradient-to-br from-yellow-100 to-yellow-50 dark:from-yellow-950 dark:to-yellow-900/50",
    border: "border-yellow-300 dark:border-yellow-800",
    glow: "shadow-[0_0_30px_-10px_rgba(250,204,21,0.3)]",
  },
  {
    icon: Medal,
    color: "text-neutral-600 dark:text-neutral-300",
    bg: "bg-gradient-to-br from-neutral-200 to-neutral-100 dark:from-neutral-800 dark:to-neutral-800/50",
    border: "border-neutral-400 dark:border-neutral-600",
    glow: "shadow-[0_0_30px_-10px_rgba(212,212,212,0.2)]",
  },
  {
    icon: Award,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-950 dark:to-orange-900/50",
    border: "border-orange-300 dark:border-orange-800",
    glow: "shadow-[0_0_30px_-10px_rgba(251,146,60,0.3)]",
  },
];

const milestones = [10, 25, 50, 100, 250];

function getNextMilestone(points: number) {
  return milestones.find((m) => m > points) || milestones[milestones.length - 1];
}

export default function Leaderboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = getStoredUser();

    if (!storedUser) {
      router.push("/login");
      return;
    }

    setUser(storedUser);

    api
      .get("/leaderboard")
      .then((res) => setLeaderboard(res.data.leaderboard))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [router]);

  if (!user) {
    return null;
  }

  const currentUserEntry = leaderboard.find((e) => e.id === user.id);
  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <AppLayout userRole={user.role}>
      <div className="p-8 max-w-3xl">
        <h1 className="text-2xl font-semibold mb-1">Leaderboard</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Top contributors making their community safer
        </p>

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-card border border-border animate-pulse"
              />
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <p className="text-muted-foreground text-center py-16">
            No contributors yet. Be the first!
          </p>
        ) : (
          <>
            {currentUserEntry && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-600/10 border border-blue-200 dark:border-blue-900 rounded-xl p-5 mb-8"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Your Progress
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {currentUserEntry.points} /{" "}
                    {getNextMilestone(currentUserEntry.points)} points
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(
                        (currentUserEntry.points /
                          getNextMilestone(currentUserEntry.points)) *
                          100,
                        100
                      )}%`,
                    }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {getNextMilestone(currentUserEntry.points) -
                    currentUserEntry.points}{" "}
                  points until next milestone
                </p>
              </motion.div>
            )}

            {topThree.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                {topThree.map((entry, index) => {
                  const rank = rankStyles[index];
                  const Icon = rank.icon;
                  const heights = ["pt-2", "pt-0", "pt-6"];
                  const order = [1, 0, 2][index];

                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.4 }}
                      style={{ order }}
                      className={`${rank.bg} ${rank.border} ${rank.glow} border rounded-xl p-4 text-center ${heights[index]}`}
                    >
                      <Icon className={`w-7 h-7 ${rank.color} mx-auto mb-2`} />
                      <p className="font-semibold text-sm truncate">
                        {entry.name}
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {entry.reportCount} reports
                      </p>
                      <p className={`text-xl font-bold ${rank.color}`}>
                        {entry.points}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {rest.length > 0 && (
              <div className="flex flex-col gap-2">
                {rest.map((entry, index) => {
                  const isCurrentUser = entry.id === user.id;

                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                        isCurrentUser
                          ? "bg-blue-600/10 border-blue-200 dark:border-blue-900"
                          : "bg-card border-border"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-semibold text-sm shrink-0">
                        {index + 4}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {entry.name}
                          {isCurrentUser && (
                            <span className="text-blue-600 dark:text-blue-400 text-xs ml-2">
                              (You)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.reportCount} report
                          {entry.reportCount !== 1 && "s"}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 text-right shrink-0">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <p className="font-bold text-blue-600 dark:text-blue-400">
                          {entry.points}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}