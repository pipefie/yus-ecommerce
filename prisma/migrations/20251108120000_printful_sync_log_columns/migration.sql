-- Add archived counts to sync log
ALTER TABLE "PrintfulSyncLog"
ADD COLUMN "archivedProducts" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "PrintfulSyncLog"
ADD COLUMN "archivedVariants" INTEGER NOT NULL DEFAULT 0;
