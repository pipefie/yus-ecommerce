import { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Gap = "sm" | "md" | "lg" | "xl";

const GAP_CLASS: Record<Gap, string> = {
  sm: "gap-[var(--layout-gap-sm)]",
  md: "gap-[var(--layout-gap-md)]",
  lg: "gap-[var(--layout-gap-lg)]",
  xl: "gap-[var(--layout-gap-xl)]",
};

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("container-shell", className)}>{children}</div>;
}

type SectionProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  bleed?: boolean;
  padding?: "none" | "default" | "wide";
  background?: "transparent" | "surface" | "surface-soft" | "card";
  className?: string;
} & Omit<HTMLAttributes<HTMLElement>, "className">;

export function Section<T extends ElementType = "section">({
  as,
  children,
  bleed = false,
  padding = "default",
  background = "transparent",
  className,
  ...rest
}: SectionProps<T>) {
  const Tag = (as ?? "section") as ElementType;
  const paddingClass =
    padding === "none"
      ? "p-0"
      : padding === "wide"
        ? "px-[var(--layout-section-px-wide)] py-[var(--layout-section-py)]"
        : "px-[var(--layout-section-px)] py-[var(--layout-section-py)]";
  const backgroundClass =
    background === "surface"
      ? "bg-surface"
      : background === "surface-soft"
        ? "bg-surface-soft"
        : background === "card"
          ? "bg-card"
          : "bg-transparent";

  return (
    <Tag
      className={cn(
        "section-shell",
        bleed ? "max-w-none px-0" : "max-w-[var(--layout-max-width)]",
        paddingClass,
        backgroundClass,
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function Stack({
  children,
  gap = "md",
  className,
}: {
  children: ReactNode;
  gap?: Gap;
  className?: string;
}) {
  return <div className={cn("flex flex-col", GAP_CLASS[gap], className)}>{children}</div>;
}

export function Inline({
  children,
  gap = "md",
  align = "start",
  className,
}: {
  children: ReactNode;
  gap?: Gap;
  align?: "start" | "center" | "end" | "between";
  className?: string;
}) {
  const alignClass =
    align === "center"
      ? "items-center"
      : align === "end"
        ? "items-end"
        : align === "between"
          ? "items-center justify-between"
          : "items-start";
  return <div className={cn("flex flex-wrap", GAP_CLASS[gap], alignClass, className)}>{children}</div>;
}
