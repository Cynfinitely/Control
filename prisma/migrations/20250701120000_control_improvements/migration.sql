-- AlterTable
ALTER TABLE "Workout" ADD COLUMN "walkKind" TEXT;

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN "relationship" TEXT;

-- CreateTable
CREATE TABLE "PrayerDebt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "prayer" TEXT NOT NULL,
    "owed" INTEGER NOT NULL,
    "fulfilled" INTEGER NOT NULL DEFAULT 0,
    "periodStart" DATETIME,
    "periodEnd" DATETIME,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PrayerDebt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PrayerDebt_userId_prayer_key" ON "PrayerDebt"("userId", "prayer");

-- CreateIndex
CREATE INDEX "PrayerDebt_userId_idx" ON "PrayerDebt"("userId");
