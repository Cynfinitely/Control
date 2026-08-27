-- Quran khatm bookmark + customizable daily readings

ALTER TABLE "QuranProgress" ADD COLUMN "fromPage" INTEGER;
ALTER TABLE "QuranProgress" ADD COLUMN "toPage" INTEGER;

CREATE TABLE "QuranState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentPage" INTEGER NOT NULL DEFAULT 1,
    "khatmsCompleted" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuranState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QuranState_userId_key" ON "QuranState"("userId");

ALTER TABLE "QuranState" ADD CONSTRAINT "QuranState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "DailyReadingItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'pages',
    "dailyTarget" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "linkKind" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyReadingItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DailyReadingItem_userId_idx" ON "DailyReadingItem"("userId");

ALTER TABLE "DailyReadingItem" ADD CONSTRAINT "DailyReadingItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "DailyReadingEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyReadingEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DailyReadingEntry_userId_date_idx" ON "DailyReadingEntry"("userId", "date");
CREATE INDEX "DailyReadingEntry_itemId_date_idx" ON "DailyReadingEntry"("itemId", "date");

ALTER TABLE "DailyReadingEntry" ADD CONSTRAINT "DailyReadingEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyReadingEntry" ADD CONSTRAINT "DailyReadingEntry_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "DailyReadingItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
