import Link from "next/link";
import { Container, Stack, Inline } from "./ui/layout";
import { Eyebrow, PageTitle, BodyText } from "./ui/typography";

const HERO_VIDEO_SRC = process.env.NEXT_PUBLIC_HERO_VIDEO ?? "";
const HERO_POSTER = "/logoWhite.png";

export default function HeroSection() {
  const hasVideo = Boolean(HERO_VIDEO_SRC?.trim());

  return (
    <section className="relative isolate overflow-hidden bg-surface-soft">
      <div
        className="absolute inset-0 opacity-80"
        style={{ background: "linear-gradient(120deg, rgba(7, 16, 41, 0.78), rgba(4, 27, 34, 0.7)), var(--gradient-hero)" }}
        aria-hidden
      />

      {hasVideo ? (
        <video
          src={HERO_VIDEO_SRC}
          autoPlay
          muted
          loop
          preload="metadata"
          playsInline
          poster={HERO_POSTER}
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
      ) : null}

      <Container className="relative z-10 flex min-h-[80vh] flex-col items-center justify-center py-24 text-center text-foreground">
        <Stack gap="lg" className="max-w-3xl items-center text-center">
          <Eyebrow align="center" className="text-neon">New drop live</Eyebrow>
          <PageTitle align="center" className="font-display leading-[var(--line-height-hero)]">
            Graphic tees born in Madrid. Built to bend the rules.
          </PageTitle>
          <BodyText tone="muted" className="max-w-2xl text-center">
            Unfiltered designs, premium cotton, micro-batch runs. We ship worldwide so you can flex the chaos anywhere.
          </BodyText>
          <Inline gap="md" align="center" className="justify-center">
            <Link
              href="#products"
              className="rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-slate-950 shadow-soft transition hover:shadow-[var(--shadow-neon)]"
            >
              Shop now
            </Link>
            <Link
              href="/products"
              className="rounded-full border border-subtle bg-white/5 px-6 py-3 text-sm font-semibold text-foreground transition hover:border-neon hover:text-neon"
            >
              Browse all products
            </Link>
          </Inline>
        </Stack>

        <div className="mt-12 grid w-full max-w-4xl grid-cols-1 gap-4 text-left sm:grid-cols-3">
          {[
            { title: "Luxe blanks", detail: "Soft heavyweight cotton with eco inks" },
            { title: "Ships fast", detail: "From Madrid to your door, tracked" },
            { title: "Limited runs", detail: "Small batches so you stand out" },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-subtle/60 bg-white/5 px-4 py-3 shadow-soft backdrop-blur"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-neon">{item.title}</p>
              <p className="mt-2 text-sm text-muted">{item.detail}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
