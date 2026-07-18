-- Work section: daily focus board + light end-of-day log

CREATE TABLE "WorkDay" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "logNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkDay_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkFocusItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workDayId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "linkType" TEXT,
    "linkId" TEXT,
    "completedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkFocusItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkDay_userId_date_key" ON "WorkDay"("userId", "date");
CREATE INDEX "WorkDay_userId_date_idx" ON "WorkDay"("userId", "date");

CREATE INDEX "WorkFocusItem_userId_workDayId_idx" ON "WorkFocusItem"("userId", "workDayId");
CREATE INDEX "WorkFocusItem_workDayId_sortOrder_idx" ON "WorkFocusItem"("workDayId", "sortOrder");
CREATE INDEX "WorkFocusItem_userId_linkType_linkId_idx" ON "WorkFocusItem"("userId", "linkType", "linkId");

ALTER TABLE "WorkDay" ADD CONSTRAINT "WorkDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkFocusItem" ADD CONSTRAINT "WorkFocusItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkFocusItem" ADD CONSTRAINT "WorkFocusItem_workDayId_fkey" FOREIGN KEY ("workDayId") REFERENCES "WorkDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
