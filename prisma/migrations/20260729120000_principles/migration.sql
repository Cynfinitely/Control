-- Principles reference list + daily review check-in

CREATE TABLE "Principle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Principle_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Principle_userId_archivedAt_idx" ON "Principle"("userId", "archivedAt");

ALTER TABLE "Principle" ADD CONSTRAINT "Principle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "PrincipleReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrincipleReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PrincipleReview_userId_date_key" ON "PrincipleReview"("userId", "date");

ALTER TABLE "PrincipleReview" ADD CONSTRAINT "PrincipleReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
