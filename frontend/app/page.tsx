"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  MapPin,
  Zap,
  Brain,
  ArrowRight,
  Users,
  Quote,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import AnimatedCounter from "@/components/AnimatedCounter";

const features = [
  {
    icon: MapPin,
    title: "Live Heatmap",
    description:
      "See incident density across your city in real time with an interactive map visualization.",
  },
  {
    icon: Zap,
    title: "Real-Time Updates",
    description:
      "Powered by WebSockets — new reports appear instantly for everyone, no refresh needed.",
  },
  {
    icon: Brain,
    title: "AI Severity Detection",
    description:
      "A machine learning model automatically classifies how urgent each report is.",
  },
  {
    icon: Users,
    title: "Community Verified",
    description:
      "Reports get verified by other citizens, keeping the data accurate and trustworthy.",
  },
];

const testimonials = [
  {
    quote:
      "I reported a broken streetlight near my house and it was fixed within a week. The live map made it easy to see it was already being tracked.",
    name: "Ritika Sharma",
    role: "Resident, Sector 12",
  },
  {
    quote:
      "As someone who walks home late, the heatmap helps me pick safer routes. It's reassuring to see the community actively reporting issues.",
    name: "Arjun Mehta",
    role: "Daily Commuter",
  },
  {
    quote:
      "The verification system means reports actually get taken seriously instead of getting lost. This is how civic tech should work.",
    name: "Priya Nair",
    role: "Local Volunteer",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function Home() {
  const [stats, setStats] = useState({
    totalIncidents: 0,
    resolvedIncidents: 0,
    verifiedIncidents: 0,
  });
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    api
      .get("/incidents/stats/public")
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 transition-all duration-300 ${
          scrolled
            ? "bg-background/80 backdrop-blur-md border-b border-border"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-blue-500" />
          <span className="text-lg font-semibold">SafeCity</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button
              variant="ghost"
              className="text-foreground/80 hover:text-foreground hover:bg-accent"
            >
              Log In
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Sign Up
            </Button>
          </Link>
        </div>
      </nav>

      <section className="relative overflow-hidden px-6 md:px-12 pt-36 pb-24">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-40 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block text-xs font-medium px-3 py-1 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 mb-6">
              Civic Incident Reporting Platform
            </span>
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight mb-5">
              Report. Track. <br /> Build safer neighborhoods.
            </h1>
            <p className="text-muted-foreground text-lg mb-8 max-w-lg">
              SafeCity lets citizens report civic incidents in real time, see
              them on a live heatmap, and help authorities respond faster.
            </p>

            <div className="flex items-center gap-3">
              <Link href="/signup">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-6">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  className="border-border bg-card hover:bg-accent text-foreground h-11 px-6"
                >
                  Log In
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            className="relative hidden lg:block"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-card/80 border border-border rounded-2xl p-5 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-foreground/80">
                  Live Incidents
                </span>
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                  Live
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                <motion.div
                  className="flex items-center gap-3 bg-background border border-border rounded-lg p-3"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: 0 }}
                >
                  <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950 flex items-center justify-center shrink-0">
                    <Flame className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      Fire reported near market
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Critical · 2 min ago
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  className="flex items-center gap-3 bg-background border border-border rounded-lg p-3"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      Streetlight outage
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Low · 12 min ago
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  className="flex items-center gap-3 bg-background border border-border rounded-lg p-3"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      Pothole marked resolved
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Verified · 30 min ago
                    </p>
                  </div>
                </motion.div>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>Updated via WebSockets</span>
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  {stats.totalIncidents} total
                </span>
              </div>
            </div>

            <motion.div
              className="absolute -bottom-4 -left-4 bg-card border border-border rounded-xl px-4 py-3 shadow-xl"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <p className="text-xs text-muted-foreground">Severity</p>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                Critical
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <motion.section
        className="px-6 md:px-12 py-10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        variants={fadeUp}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 text-center">
          <div className="bg-card border border-border rounded-xl py-6">
            <p className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400">
              <AnimatedCounter target={stats.totalIncidents} />
            </p>
            <p className="text-sm text-muted-foreground mt-1">Incidents Reported</p>
          </div>
          <div className="bg-card border border-border rounded-xl py-6">
            <p className="text-3xl md:text-4xl font-bold text-emerald-600 dark:text-emerald-400">
              <AnimatedCounter target={stats.resolvedIncidents} />
            </p>
            <p className="text-sm text-muted-foreground mt-1">Issues Resolved</p>
          </div>
          <div className="bg-card border border-border rounded-xl py-6">
            <p className="text-3xl md:text-4xl font-bold text-yellow-600 dark:text-yellow-400">
              <AnimatedCounter target={stats.verifiedIncidents} />
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Community Verified
            </p>
          </div>
        </div>
      </motion.section>

      <section className="px-6 md:px-12 py-20 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-3xl font-semibold mb-3">
              Everything you need to keep your city safe
            </h2>
            <p className="text-muted-foreground">
              Built with modern tools for a fast, reliable experience
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  className="group bg-card border border-border rounded-xl p-6 hover:border-blue-300 dark:hover:border-blue-900 hover:bg-accent/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)]"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.4 }}
                  variants={fadeUp}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-600/15 flex items-center justify-center mb-4 group-hover:bg-blue-600/25 transition-colors">
                    <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 md:px-12 py-20 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-3xl font-semibold mb-3">
              Trusted by citizens making a difference
            </h2>
            <p className="text-muted-foreground">
              Real stories from people using SafeCity
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, index) => (
              <motion.div
                key={t.name}
                className="bg-card border border-border rounded-xl p-6 hover:border-foreground/20 transition-all duration-300 hover:-translate-y-1"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.4 }}
                variants={fadeUp}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Quote className="w-6 h-6 text-blue-500/40 mb-3" />
                <p className="text-sm text-foreground/90 leading-relaxed mb-5">
                  {t.quote}
                </p>
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <motion.section
        className="px-6 md:px-12 py-20 border-t border-border"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        variants={fadeUp}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">
            Ready to make your neighborhood safer?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join citizens already using SafeCity to report and track civic
            issues.
          </p>
          <Link href="/signup">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-8">
              Create Your Account
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </motion.section>

      <footer className="px-6 md:px-12 py-8 border-t border-border text-center text-sm text-muted-foreground/70">
        © 2026 SafeCity. All rights reserved.
      </footer>
    </main>
  );
}