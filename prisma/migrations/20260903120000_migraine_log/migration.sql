-- Health: one peak-pain migraine day per user

CREATE TABLE "MigraineLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "pain" INTEGER NOT NULL,
    "durationMin" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MigraineLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MigraineLog_userId_date_key" ON "MigraineLog"("userId", "date");

ALTER TABLE "MigraineLog" ADD CONSTRAINT "MigraineLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
