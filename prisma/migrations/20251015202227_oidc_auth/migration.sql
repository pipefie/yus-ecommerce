/*
  Warnings:

  - Added the required column sub to the User table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sub" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "picture" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "newsletterOptIn" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("id", "sub", "email", "name", "picture", "password", "role", "newsletterOptIn", "createdAt", "updatedAt")
SELECT "id",
       COALESCE("email", 'legacy-' || "id"),
       "email",
       "name",
       NULL,
       "password",
       "role",
       "newsletterOptIn",
       "createdAt",
       "updatedAt"
FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_sub_key" ON "User"("sub");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
