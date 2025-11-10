-- CreateTable
CREATE TABLE "PrintfulSyncLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "status" TEXT NOT NULL,
    "actor" TEXT,
    "source" TEXT,
    "cleared" BOOLEAN NOT NULL DEFAULT false,
    "processedProducts" INTEGER NOT NULL DEFAULT 0,
    "processedVariants" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
