-- Control improvements: walk kind, contact relationship, prayer debt

-- AlterTable
ALTER TABLE "Workout" ADD COLUMN "walkKind" TEXT;

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN "relationship" TEXT;

-- CreateTable
CREATE TABLE "PrayerDebt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prayer" TEXT NOT NULL,
    "owed" INTEGER NOT NULL,
    "fulfilled" INTEGER NOT NULL DEFAULT 0,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrayerDebt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrayerDebt_userId_prayer_key" ON "PrayerDebt"("userId", "prayer");

-- CreateIndex
CREATE INDEX "PrayerDebt_userId_idx" ON "PrayerDebt"("userId");

-- AddForeignKey
ALTER TABLE "PrayerDebt" ADD CONSTRAINT "PrayerDebt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
