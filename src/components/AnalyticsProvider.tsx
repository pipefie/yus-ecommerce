"use client";

import { ReactNode, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/analytics/eventQueue";

export default function AnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const url = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
  const prevUrlRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(typeof performance !== "undefined" ? performance.now() : Date.now());
  const maxScrollRef = useRef<number>(0);
  const sessionInitializedRef = useRef(false);

  useEffect(() => {
    if (!sessionInitializedRef.current) {
      sessionInitializedRef.current = true;
      trackEvent("session_start", "app", { dedupeKey: "session-start" });
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const doc = document.documentElement;
        const scrollTop = doc.scrollTop || document.body.scrollTop || 0;
        const viewport = window.innerHeight || 1;
        const total = doc.scrollHeight || viewport;
        const depth = Math.min(1, (scrollTop + viewport) / total);
        if (depth > maxScrollRef.current) {
          maxScrollRef.current = depth;
        }
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (prevUrlRef.current) {
      const durationMs = now - startTimeRef.current;
      trackEvent("page_dwell", "page", {
        metadata: {
          path: prevUrlRef.current,
          durationMs: Math.round(durationMs),
        },
      });
      trackEvent("page_scroll_depth", "page", {
        metadata: {
          path: prevUrlRef.current,
          depth: Number(maxScrollRef.current.toFixed(3)),
        },
      });
    }

    trackEvent("page_view", "page", {
      metadata: {
        path: url,
        referrer: prevUrlRef.current,
      },
    });

    prevUrlRef.current = url;
    startTimeRef.current = now;
    maxScrollRef.current = 0;
  }, [url]);

  return <>{children}</>;
}
