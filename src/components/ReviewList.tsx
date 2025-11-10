"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";

interface Review {
  _id: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json() as Promise<Review[]>);

export default function ReviewList({ productId }: { productId: string }) {
  const { data: reviews = [], mutate } = useSWR<Review[]>(`/api/reviews?productId=${productId}`, fetcher);
  const [author, setAuthor] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const average = useMemo(() => {
    if (!reviews.length) return 0;
    const total = reviews.reduce((sum, entry) => sum + entry.rating, 0);
    return total / reviews.length;
  }, [reviews]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!author.trim() || !comment.trim()) {
      setBanner({ type: "error", message: "Please add your name and review before submitting." });
      return;
    }
    setIsSubmitting(true);
    setBanner(null);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, author, comment, rating }),
      });
      if (!response.ok) {
        throw new Error("Unable to save your review. Please try again.");
      }
      setAuthor("");
      setComment("");
      setRating(5);
      setBanner({ type: "success", message: "Thanks! Your review is now pending moderation." });
      mutate();
    } catch (error) {
      setBanner({
        type: "error",
        message: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-800/80 bg-slate-950/60 p-6 shadow-[0_0_60px_rgba(15,23,42,0.4)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Community reviews</p>
          <h3 className="text-2xl font-semibold text-white">Hear it from the crew</h3>
        </div>
        <div className="text-right text-sm text-slate-400">
          <div className="text-2xl font-semibold text-white">
            {average.toFixed(1)} <span className="text-sm text-amber-300">/ 5</span>
          </div>
          <p>{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</p>
        </div>
      </div>

      {banner ? (
        <p
          className={`mt-4 rounded-2xl border px-4 py-2 text-sm ${
            banner.type === "success"
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200"
              : "border-amber-500/50 bg-amber-500/10 text-amber-200"
          }`}
        >
          {banner.message}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4 overflow-y-auto pr-2 max-h-[360px]">
          {reviews.length ? (
            reviews.map((review) => (
              <article key={review._id} className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{review.author}</p>
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <StarRow value={review.rating} />
                </div>
                <p className="mt-3 text-sm text-slate-300">{review.comment}</p>
              </article>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-800/60 p-8 text-center text-sm text-slate-400">
              Nobody has dropped a review (yet). Be the first voice of the community.
            </p>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border border-slate-800/80 bg-slate-950/80 p-5"
        >
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">Name</label>
            <input
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
              placeholder="Luna"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">Your review</label>
            <textarea
              rows={4}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
              placeholder="Tell the squad how it fits, feels, and flexes."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">Rating: {rating}/5</label>
            <input
              type="range"
              min={1}
              max={5}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="mt-2 w-full accent-emerald-400"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-emerald-400/90 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
          >
            {isSubmitting ? "Sending…" : "Post review"}
          </button>
        </form>
      </div>
    </section>
  );
}

function StarRow({ value }: { value: number }) {
  return (
    <div className="flex gap-1 text-lg">
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className={index < value ? "text-amber-300" : "text-slate-700"}>
          ★
        </span>
      ))}
    </div>
  );
}
