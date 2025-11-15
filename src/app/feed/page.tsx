"use client";

import useSWR from "swr";
import Image from "next/image";
import Link from "next/link";
import type { SocialPost } from "@/lib/socialFeed";

type FeedResponse = { feed: SocialPost[] };
const fetcher = (url: string) => fetch(url).then((res) => res.json() as Promise<FeedResponse>);

const platformStyles: Record<string, { badge: string; gradient: string }> = {
  instagram: { badge: "text-pink-300", gradient: "from-pink-600/20" },
  twitter: { badge: "text-sky-300", gradient: "from-sky-600/20" },
  tiktok: { badge: "text-emerald-300", gradient: "from-emerald-600/20" },
};

export default function FeedPage() {
  const { data, isLoading } = useSWR("/api/social-feed", fetcher, { refreshInterval: 60_000 });
  const posts = data?.feed ?? [];

  return (
    <main className="min-h-screen bg-slate-950 pt-20 pb-24 text-white">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Social feed</p>
          <h1 className="mt-4 text-4xl font-semibold">Memes, drops & chaos—live from our socials</h1>
          <p className="mt-3 text-slate-400">
            Fresh pulls from Instagram, TikTok, and X. Tap into the stream and follow along where it happens first.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {(isLoading ? placeholderPosts : posts).map((post) => (
            <FeedCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </main>
  );
}

function FeedCard({ post }: { post: SocialPost }) {
  const styles = platformStyles[post.platform] ?? platformStyles.instagram;

  return (
    <Link
      href={post.permalink || "#"}
      target="_blank"
      className={`group flex flex-col rounded-3xl border border-slate-800/80 bg-gradient-to-br ${styles.gradient} via-slate-950/40 to-slate-950/80 p-5 transition hover:-translate-y-1`}
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
        <span className={styles.badge}>{post.platform}</span>
        <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
      </div>
      <p className="mt-4 text-sm text-white">{post.text || "New post live now."}</p>
      {post.mediaUrl ? (
        <div className="relative mt-4 aspect-video overflow-hidden rounded-2xl border border-slate-900/60 bg-slate-900">
          <Image src={post.mediaUrl} alt={post.text} fill className="object-cover" sizes="360px" />
        </div>
      ) : null}
      <span className="mt-6 text-xs font-semibold text-emerald-300">
        Open post →
      </span>
    </Link>
  );
}

const placeholderPosts: SocialPost[] = Array.from({ length: 4 }).map((_, index) => ({
  id: `placeholder-${index}`,
  platform: (["instagram", "twitter", "tiktok"][index % 3] ?? "instagram") as SocialPost["platform"],
  text: "Syncing the latest memes…",
  mediaUrl: null,
  permalink: "#",
  publishedAt: new Date().toISOString(),
}));
