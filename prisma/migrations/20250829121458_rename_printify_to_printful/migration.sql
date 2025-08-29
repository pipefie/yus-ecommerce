/*
  Warnings:

  - You are about to drop the column `printifyId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `printifyId` on the `Variant` table. All the data in the column will be lost.
  - Added the required column `printfulProductId` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `printfulVariantId` to the `Variant` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "printfulProductId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "images" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Product" ("createdAt", "description", "id", "imageUrl", "images", "price", "slug", "title", "updatedAt") SELECT "createdAt", "description", "id", "imageUrl", "images", "price", "slug", "title", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_printfulProductId_key" ON "Product"("printfulProductId");
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE TABLE "new_Variant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "printfulVariantId" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "size" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "previewUrl" TEXT NOT NULL,
    "designUrls" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Variant" ("color", "createdAt", "designUrls", "id", "imageUrl", "previewUrl", "price", "productId", "size", "updatedAt") SELECT "color", "createdAt", "designUrls", "id", "imageUrl", "previewUrl", "price", "productId", "size", "updatedAt" FROM "Variant";
DROP TABLE "Variant";
ALTER TABLE "new_Variant" RENAME TO "Variant";
CREATE UNIQUE INDEX "Variant_printfulVariantId_key" ON "Variant"("printfulVariantId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
