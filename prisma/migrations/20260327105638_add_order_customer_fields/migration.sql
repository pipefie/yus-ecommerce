-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "printfulOrderId" TEXT,
ADD COLUMN     "shippingAddress" JSONB;
