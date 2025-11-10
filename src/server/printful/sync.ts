import { prisma } from "@/lib/prisma";
import {
  fetchPrintfulProducts,
  fetchPrintfulProductDetail,
  mapToSummary,
  mapToDetail,
} from "@/utils/printful";

type RunPrintfulSyncOptions = {
  clear?: boolean;
  actor?: string;
  source?: string;
};

type RunPrintfulSyncResult = {
  ok: true;
  cleared: boolean;
  processedProducts: number;
  processedVariants: number;
  archivedProducts: number;
  archivedVariants: number;
};

export async function runPrintfulSync({
  clear = false,
  actor,
  source = "unknown",
}: RunPrintfulSyncOptions = {}): Promise<RunPrintfulSyncResult> {
  const startedAt = new Date();
  let processedProducts = 0;
  let processedVariants = 0;
  let archivedProducts = 0;
  let archivedVariants = 0;

  const syncedProductIds = new Set<string>();
  const syncedVariantIds = new Set<string>();

  try {
    if (clear) {
      await prisma.variant.updateMany({
        data: {
          imageUrl: "",
          previewUrl: "",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          designUrls: [] as any,
        },
      });
      await prisma.product.updateMany({
        data: {
          imageUrl: "",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          images: [] as any,
        },
      });
    }

    const rawList = await fetchPrintfulProducts();
    const summaries = rawList.map(mapToSummary);

    for (const summary of summaries) {
      const rawDetail = await fetchPrintfulProductDetail(summary.printfulProductId);
      const detail = mapToDetail(summary.slug, rawDetail);
      const basePrice =
        detail.variants.reduce(
          (min, variant) => Math.min(min, variant.price),
          Infinity,
        ) || 0;

      await prisma.product.upsert({
        where: { printfulProductId: String(detail.printfulProductId) },
        update: {
          slug: detail.slug,
          title: detail.title,
          description: detail.description,
          price: basePrice,
          imageUrl: detail.images[0] ?? "",
          images: detail.images,
          deleted: false,
        },
        create: {
          printfulProductId: String(detail.printfulProductId),
          slug: detail.slug,
          title: detail.title,
          description: detail.description,
          price: basePrice,
          imageUrl: detail.images[0] ?? "",
          images: detail.images,
        },
      });
      processedProducts += 1;
      syncedProductIds.add(String(detail.printfulProductId));

      for (const variant of detail.variants) {
        await prisma.variant.upsert({
          where: { printfulVariantId: String(variant.id) },
          update: {
            product: { connect: { printfulProductId: String(detail.printfulProductId) } },
            price: variant.price,
            color: variant.color,
            size: variant.size,
            imageUrl: variant.designUrls[0] ?? "",
            previewUrl: variant.designUrls[0] ?? "",
            designUrls: variant.designUrls,
            deleted: false,
          },
          create: {
            printfulVariantId: String(variant.id),
            product: { connect: { printfulProductId: String(detail.printfulProductId) } },
            price: variant.price,
            color: variant.color,
            size: variant.size,
            imageUrl: variant.designUrls[0] ?? "",
            previewUrl: variant.designUrls[0] ?? "",
            designUrls: variant.designUrls,
          },
        });
        processedVariants += 1;
        syncedVariantIds.add(String(variant.id));
      }
    }

    if (syncedProductIds.size > 0) {
      const { count } = await prisma.product.updateMany({
        where: {
          printfulProductId: {
            notIn: Array.from(syncedProductIds),
          },
          deleted: false,
        },
        data: { deleted: true },
      });
      archivedProducts = count;
    }

    if (syncedVariantIds.size > 0) {
      const { count } = await prisma.variant.updateMany({
        where: {
          printfulVariantId: {
            notIn: Array.from(syncedVariantIds),
          },
          deleted: false,
        },
        data: { deleted: true },
      });
      archivedVariants = count;
    }

    await prisma.printfulSyncLog.create({
      data: {
        startedAt,
        finishedAt: new Date(),
        status: "success",
        actor,
        source,
        cleared: clear,
        processedProducts,
        processedVariants,
        archivedProducts,
        archivedVariants,
      },
    });

    return {
      ok: true,
      cleared: clear,
      processedProducts,
      processedVariants,
      archivedProducts,
      archivedVariants,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await prisma.printfulSyncLog.create({
      data: {
        startedAt,
        finishedAt: new Date(),
        status: "failed",
        actor,
        source,
        cleared: clear,
        processedProducts,
        processedVariants,
        error: message,
        archivedProducts,
        archivedVariants,
      },
    });
    throw error;
  }
}
