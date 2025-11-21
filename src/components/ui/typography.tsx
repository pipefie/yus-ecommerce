import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Align = "left" | "center" | "right";

export function Eyebrow({ children, align = "left", className }: { children: ReactNode; align?: Align; className?: string }) {
  return (
    <p
      className={cn(
        "section-kicker",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function PageTitle({
  children,
  align = "center",
  className,
}: {
  children: ReactNode;
  align?: Align;
  className?: string;
}) {
  return (
    <h1
      className={cn(
        "text-balance font-semibold",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className,
      )}
      style={{ fontSize: "var(--font-size-hero)", lineHeight: "var(--line-height-hero)" }}
    >
      {children}
    </h1>
  );
}

export function SectionTitle({
  children,
  align = "center",
  className,
}: {
  children: ReactNode;
  align?: Align;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "section-heading font-semibold",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className,
      )}
      style={{ lineHeight: "var(--line-height-tight)" }}
    >
      {children}
    </h2>
  );
}

export function BodyText({
  children,
  tone = "muted",
  className,
}: {
  children: ReactNode;
  tone?: "muted" | "default";
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-base",
        tone === "muted" ? "text-muted" : "text-foreground",
        "leading-[var(--line-height-normal)]",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function MutedText({ children, className }: { children: ReactNode; className?: string }) {
  return <BodyText tone="muted" className={className}>{children}</BodyText>;
}
