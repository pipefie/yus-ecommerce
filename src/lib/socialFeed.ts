"use server";

import { env } from "@/lib/env";

export type SocialPlatform = "instagram" | "tiktok" | "twitter";

export type SocialPost = {
  id: string;
  platform: SocialPlatform;
  text: string;
  mediaUrl: string | null;
  permalink: string;
  publishedAt: string;
};

export async function fetchSocialFeed(): Promise<SocialPost[]> {
  const [instagram, twitter, tiktok] = await Promise.allSettled([
    fetchInstagramFeed(),
    fetchTwitterFeed(),
    fetchTikTokFeed(),
  ]);

  const merged: SocialPost[] = [
    ...(instagram.status === "fulfilled" ? instagram.value : []),
    ...(twitter.status === "fulfilled" ? twitter.value : []),
    ...(tiktok.status === "fulfilled" ? tiktok.value : []),
  ];

  if (merged.length) {
    return merged
      .sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      )
      .slice(0, 30);
  }

  return FALLBACK_POSTS;
}

async function fetchInstagramFeed(): Promise<SocialPost[]> {
  if (!env.INSTAGRAM_ACCESS_TOKEN || !env.INSTAGRAM_USER_ID) {
    return [];
  }

  const params = new URLSearchParams({
    fields: "id,caption,media_url,permalink,thumbnail_url,timestamp",
    access_token: env.INSTAGRAM_ACCESS_TOKEN,
    limit: "12",
  });

  const response = await fetch(
    `https://graph.instagram.com/${env.INSTAGRAM_USER_ID}/media?${params.toString()}`,
    { next: { revalidate: 300 } },
  );

  if (!response.ok) {
    throw new Error(`Instagram API responded with ${response.status}`);
  }

  const payload: { data: Array<Record<string, string>> } = await response.json();
  return payload.data?.map((entry) => ({
    id: `instagram-${entry.id}`,
    platform: "instagram",
    text: entry.caption ?? "",
    mediaUrl: entry.media_url ?? entry.thumbnail_url ?? null,
    permalink: entry.permalink ?? "",
    publishedAt: entry.timestamp ?? new Date().toISOString(),
  })) ?? [];
}

async function fetchTwitterFeed(): Promise<SocialPost[]> {
  if (!env.TWITTER_BEARER_TOKEN || !env.TWITTER_USER_ID) {
    return [];
  }

  const params = new URLSearchParams({
    "tweet.fields": "created_at,entities",
    expansions: "attachments.media_keys",
    "media.fields": "url,preview_image_url",
    max_results: "10",
  });

  const response = await fetch(
    `https://api.twitter.com/2/users/${env.TWITTER_USER_ID}/tweets?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${env.TWITTER_BEARER_TOKEN}` },
      next: { revalidate: 300 },
    },
  );

  if (!response.ok) {
    throw new Error(`Twitter API responded with ${response.status}`);
  }

  type TwitterPayload = {
    data?: Array<{
      id: string;
      text: string;
      created_at: string;
      attachments?: { media_keys?: string[] };
    }>;
    includes?: { media?: Array<{ media_key: string; url?: string; preview_image_url?: string }> };
  };
  const payload: TwitterPayload = await response.json();
  const mediaMap = new Map(
    payload.includes?.media?.map((media) => [media.media_key, media.url ?? media.preview_image_url ?? null]),
  );

  return (
    payload.data?.map((tweet) => {
      const mediaKey = tweet.attachments?.media_keys?.[0];
      const mediaUrl = mediaKey ? mediaMap.get(mediaKey) ?? null : null;
      const username = env.TWITTER_USERNAME ?? "twitter";
      return {
        id: `twitter-${tweet.id}`,
        platform: "twitter" as const,
        text: tweet.text,
        mediaUrl,
        permalink: `https://twitter.com/${username}/status/${tweet.id}`,
        publishedAt: tweet.created_at,
      };
    }) ?? []
  );
}

async function fetchTikTokFeed(): Promise<SocialPost[]> {
  if (!env.TIKTOK_ACCESS_TOKEN || !env.TIKTOK_USER_ID) {
    return [];
  }

  const response = await fetch("https://open.tiktokapis.com/v2/post/publish/list/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.TIKTOK_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      open_id: env.TIKTOK_USER_ID,
      max_count: 10,
    }),
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`TikTok API responded with ${response.status}`);
  }

  type TikTokPayload = {
    data?: { videos?: Array<{ id: string; title?: string; cover_url?: string; share_url?: string; create_time?: number }> };
  };

  const payload: TikTokPayload = await response.json();
  return (
    payload.data?.videos?.map((video) => ({
      id: `tiktok-${video.id}`,
      platform: "tiktok" as const,
      text: video.title ?? "",
      mediaUrl: video.cover_url ?? null,
      permalink: video.share_url ?? "",
      publishedAt: video.create_time ? new Date(video.create_time * 1000).toISOString() : new Date().toISOString(),
    })) ?? []
  );
}

const FALLBACK_POSTS: SocialPost[] = [
  {
    id: "fallback-1",
    platform: "instagram",
    text: "Studio lights, late nights. New capsule dropping this Friday.",
    mediaUrl: null,
    permalink: "https://instagram.com",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "fallback-2",
    platform: "twitter",
    text: "Reminder: comfort ≠ boring. Layer textures, add neon, start conversations.",
    mediaUrl: null,
    permalink: "https://twitter.com",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "fallback-3",
    platform: "tiktok",
    text: "POV: you unbox the Y-US? mystery bundle and instantly become the main character.",
    mediaUrl: null,
    permalink: "https://tiktok.com",
    publishedAt: new Date().toISOString(),
  },
];
