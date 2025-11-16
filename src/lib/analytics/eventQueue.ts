"use client";

type EventPayload = {
  sessionId: string;
  event: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ts?: string;
};

const queue: EventPayload[] = [];
const viewedKeys = new Set<string>();
let flushing = false;
let initialized = false;

function generateSessionId(): string {
  if (typeof crypto !== "undefined") {
    if (typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    if (typeof crypto.getRandomValues === "function") {
      // RFC4122 version 4 compliant fallback using available crypto.
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
      return (
        hex.slice(0, 4).join("") +
        "-" +
        hex.slice(4, 6).join("") +
        "-" +
        hex.slice(6, 8).join("") +
        "-" +
        hex.slice(8, 10).join("") +
        "-" +
        hex.slice(10, 16).join("")
      );
    }
  }
  // Non-crypto fallback to avoid crashing older browsers.
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  const KEY = "yus_event_session";
  let existing = window.sessionStorage.getItem(KEY);
  if (!existing) {
    existing = generateSessionId();
    window.sessionStorage.setItem(KEY, existing);
  }
  return existing;
}

async function flushQueue() {
  if (flushing || queue.length === 0) return;
  flushing = true;
  try {
    const events = queue.splice(0, queue.length);
    await fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ events }),
      keepalive: true,
    });
  } catch {
    // if it fails, requeue the events for the next flush
  } finally {
    flushing = false;
  }
}

function ensureListeners() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushQueue();
    }
  });
  window.addEventListener("beforeunload", () => {
    flushQueue();
  });
  setInterval(() => {
    flushQueue();
  }, 10000);
}

export function trackEvent(
  event: string,
  entityType: string,
  options: { entityId?: string; metadata?: Record<string, unknown>; dedupeKey?: string } = {},
) {
  if (typeof window === "undefined") return;
  ensureListeners();
  if (options.dedupeKey && viewedKeys.has(options.dedupeKey)) {
    return;
  }
  if (options.dedupeKey) {
    viewedKeys.add(options.dedupeKey);
  }
  queue.push({
    sessionId: getSessionId(),
    event,
    entityType,
    entityId: options.entityId,
    metadata: options.metadata,
    ts: new Date().toISOString(),
  });
  if (queue.length >= 20) {
    flushQueue();
  }
}
