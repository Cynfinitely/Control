-- Ranked life priorities (free-form titles, independent of todo priority)

CREATE TABLE "LifePriority" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LifePriority_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LifePriority_userId_sortOrder_idx" ON "LifePriority"("userId", "sortOrder");

ALTER TABLE "LifePriority" ADD CONSTRAINT "LifePriority_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
