// src/server/mockups/metadata.ts
import path from "node:path";

export type VariantSummary = {
  id: number;
  printfulVariantId: string | null;
  color: string;
  size: string;
};

export type MockupMetadata = {
  variantId?: number;
  placement?: string;
  sortIndex?: number;
};

type ManifestRawEntry =
  | {
      file?: unknown;
      filename?: unknown;
      path?: unknown;
      variantId?: unknown;
      variant?: unknown;
      variantExternalId?: unknown;
      variantPrintfulId?: unknown;
      variantSku?: unknown;
      color?: unknown;
      variantColor?: unknown;
      size?: unknown;
      placement?: unknown;
      sortIndex?: unknown;
    }
  | Record<string, unknown>;

export type ManifestLookup = Map<string, MockupMetadata & { color?: string; size?: string }>;

const placementTokens = new Set([
  "front",
  "back",
  "left",
  "right",
  "side",
  "detail",
  "lifestyle",
  "folded",
  "tag",
  "closeup",
]);

const numericRe = /^\d+$/;

function normalizePlacement(input: unknown): string | undefined {
  const token = normalizeToken(input);
  if (token && placementTokens.has(token)) return token;
  return undefined;
}

const sizeAliases: Record<string, string> = {
  xxs: "xxs",
  xs: "xs",
  s: "s",
  m: "m",
  l: "l",
  xl: "xl",
  xxl: "xxl",
  "2xl": "xxl",
  "3xl": "xxxl",
  "4xl": "xxxxl",
  "5xl": "xxxxxl",
  "one": "onesize",
  "onesize": "onesize",
  "uni": "onesize",
};

const recognizedSizes = new Set(Object.values(sizeAliases));

function normalizeToken(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function normalizeSize(input: unknown): string {
  const token = normalizeToken(input);
  return sizeAliases[token] ?? token;
}

export function sanitizeZipPath(rawPath: string): { normalizedPath: string; safeFileName: string } {
  const cleaned = rawPath.replace(/\\/g, "/");
  const parts = cleaned.split("/").filter(Boolean);
  const safeParts = parts.map((segment, idx) => {
    const safe = segment.replace(/[^a-zA-Z0-9._-]/g, "-");
    // avoid very long path components that S3 objects dislike
    return safe.slice(0, idx === parts.length - 1 ? 180 : 80);
  });
  const normalizedPath = safeParts.join("/").toLowerCase();
  const safeFileName = safeParts.at(-1) ?? "file";
  return { normalizedPath, safeFileName };
}

type VariantIndex = {
  byId: Map<string, VariantSummary>;
  byPrintfulId: Map<string, VariantSummary>;
  byColor: Map<string, VariantSummary[]>;
  byColorSize: Map<string, VariantSummary>;
};

function buildVariantIndex(variants: VariantSummary[]): VariantIndex {
  const byId = new Map<string, VariantSummary>();
  const byPrintfulId = new Map<string, VariantSummary>();
  const byColor = new Map<string, VariantSummary[]>();
  const byColorSize = new Map<string, VariantSummary>();

  for (const variant of variants) {
    const idKey = String(variant.id);
    byId.set(idKey, variant);

    const printfulKey = normalizeToken(variant.printfulVariantId ?? "");
    if (printfulKey) {
      byPrintfulId.set(printfulKey, variant);
    }

    const colorKey = normalizeToken(variant.color);
    const sizeKey = normalizeSize(variant.size);
    if (colorKey) {
      const existing = byColor.get(colorKey) ?? [];
      existing.push(variant);
      byColor.set(colorKey, existing);

      if (sizeKey) {
        byColorSize.set(`${colorKey}:${sizeKey}`, variant);
      }
    }
  }

  return { byId, byPrintfulId, byColor, byColorSize };
}

function resolveVariantIdFromHints(
  hints: { variantId?: unknown; variant?: unknown; variantExternalId?: unknown; variantPrintfulId?: unknown; variantSku?: unknown; color?: unknown; size?: unknown },
  index: VariantIndex,
): number | undefined {
  const directIds = [hints.variantId, hints.variant, hints.variantExternalId].map((value) =>
    typeof value === "number" || typeof value === "string" ? String(value) : "",
  );

  for (const id of directIds) {
    if (!id) continue;
    const variant = index.byId.get(id);
    if (variant) return variant.id;
  }

  const printfulHints = [hints.variantPrintfulId, hints.variantSku].map((value) => normalizeToken(value));
  for (const key of printfulHints) {
    if (!key) continue;
    const variant = index.byPrintfulId.get(key);
    if (variant) return variant.id;
  }

  const colorKey = normalizeToken(hints.color ?? "");
  const sizeKey = normalizeSize(hints.size);
  if (colorKey) {
    if (sizeKey) {
      const variant = index.byColorSize.get(`${colorKey}:${sizeKey}`);
      if (variant) return variant.id;
    }

    const candidates = index.byColor.get(colorKey);
    if (candidates?.length) {
      return candidates[0]?.id;
    }
  }

  return undefined;
}

export function parseMockupsManifest(raw: unknown, variants: VariantSummary[]): ManifestLookup {
  if (!raw) return new Map();
  const lookup: ManifestLookup = new Map();

  const index = buildVariantIndex(variants);

  const entries: ManifestRawEntry[] = [];
  if (Array.isArray(raw)) {
    entries.push(...(raw as ManifestRawEntry[]));
  } else if (typeof raw === "object") {
    const record = raw as Record<string, unknown>;
    if (Array.isArray(record.mockups)) {
      entries.push(...(record.mockups as ManifestRawEntry[]));
    } else {
      for (const [file, meta] of Object.entries(record)) {
        if (!meta || typeof meta !== "object") continue;
        entries.push({ file, ...(meta as Record<string, unknown>) });
      }
    }
  }

  for (const entry of entries) {
    const file =
      typeof entry.file === "string"
        ? entry.file
        : typeof entry.filename === "string"
          ? entry.filename
          : typeof entry.path === "string"
            ? entry.path
            : undefined;
    if (!file) continue;

    const { normalizedPath } = sanitizeZipPath(file);
    const placement = normalizePlacement(entry.placement);
    const sortIndex = typeof entry.sortIndex === "number" ? entry.sortIndex : numericRe.test(String(entry.sortIndex ?? "")) ? Number(entry.sortIndex) : undefined;
    const color = typeof entry.color === "string" ? entry.color : typeof entry.variantColor === "string" ? entry.variantColor : undefined;
    const size = typeof entry.size === "string" ? entry.size : undefined;

    const variantId = resolveVariantIdFromHints(
      {
        variantId: entry.variantId,
        variant: entry.variant,
        variantExternalId: entry.variantExternalId,
        variantPrintfulId: entry.variantPrintfulId,
        variantSku: entry.variantSku,
        color,
        size,
      },
      index,
    );

    lookup.set(normalizedPath, {
      variantId,
      placement,
      sortIndex: sortIndex ?? undefined,
      color,
      size,
    });
  }

  return lookup;
}

export function deriveMetadataFromFilename(
  filePath: string,
  variants: VariantSummary[],
): (MockupMetadata & { colorHint?: string; sizeHint?: string }) {
  const index = buildVariantIndex(variants);
  const rawBase = path.parse(filePath).name;
  if (!rawBase) return {};

  const cleanedBase = rawBase
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

  const tokens = cleanedBase.split(/[\s._-]+/).map((token) => token.replace(/[^a-z0-9]/g, "")).filter(Boolean);
  let placement: string | undefined;
  let sortIndex: number | undefined;
  let colorHint: string | undefined;
  let sizeHint: string | undefined;

  for (const token of tokens) {
    if (!placement && placementTokens.has(token)) {
      placement = token;
      continue;
    }

    if (!colorHint && index.byColor.has(token)) {
      colorHint = token;
      continue;
    }

    if (!sizeHint) {
      const normalizedSize = normalizeSize(token);
      if (normalizedSize && recognizedSizes.has(normalizedSize)) {
        sizeHint = normalizedSize;
        continue;
      }
    }

    if (!sortIndex && numericRe.test(token)) {
      sortIndex = Number(token);
    }
  }

  let variantId: number | undefined;
  if (colorHint) {
    if (sizeHint) {
      const variant = index.byColorSize.get(`${colorHint}:${sizeHint}`);
      variantId = variant?.id;
    }
    if (!variantId) {
      const candidate = index.byColor.get(colorHint)?.[0];
      variantId = candidate?.id;
    }
  }

  return {
    variantId,
    placement,
    sortIndex,
    colorHint,
    sizeHint,
  };
}

export function resolveMockupMetadata(
  normalizedPath: string,
  opts: {
    manifest?: ManifestLookup;
    variants: VariantSummary[];
    fallbackSortIndex?: number;
  },
): MockupMetadata {
  const { manifest, variants, fallbackSortIndex } = opts;
  const manifestMatch = manifest?.get(normalizedPath) ?? manifest?.get(normalizedPath.split("/").pop() ?? "");

  const filenameMeta = deriveMetadataFromFilename(normalizedPath, variants);

  return {
    variantId: manifestMatch?.variantId ?? filenameMeta.variantId,
    placement: manifestMatch?.placement ?? filenameMeta.placement,
    sortIndex:
      manifestMatch?.sortIndex ??
      filenameMeta.sortIndex ??
      (typeof fallbackSortIndex === "number" ? fallbackSortIndex : undefined),
  };
}
