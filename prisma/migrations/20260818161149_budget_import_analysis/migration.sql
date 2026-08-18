-- Budget import: nullable categories, batches, merchant rules

CREATE TABLE "BudgetImportBatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "skippedDuplicates" INTEGER NOT NULL DEFAULT 0,
    "dateFrom" TIMESTAMP(3),
    "dateTo" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "BudgetImportBatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BudgetCategoryRule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantKey" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetCategoryRule_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "BudgetTransaction" ALTER COLUMN "categoryId" DROP NOT NULL;
ALTER TABLE "BudgetTransaction" ADD COLUMN "merchantKey" TEXT;
ALTER TABLE "BudgetTransaction" ADD COLUMN "rawDescription" TEXT;
ALTER TABLE "BudgetTransaction" ADD COLUMN "importFingerprint" TEXT;
ALTER TABLE "BudgetTransaction" ADD COLUMN "importBatchId" TEXT;

-- AddForeignKey
ALTER TABLE "BudgetImportBatch" ADD CONSTRAINT "BudgetImportBatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BudgetCategoryRule" ADD CONSTRAINT "BudgetCategoryRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BudgetCategoryRule" ADD CONSTRAINT "BudgetCategoryRule_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BudgetCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BudgetTransaction" ADD CONSTRAINT "BudgetTransaction_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "BudgetImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "BudgetImportBatch_userId_importedAt_idx" ON "BudgetImportBatch"("userId", "importedAt");

CREATE INDEX "BudgetCategoryRule_userId_idx" ON "BudgetCategoryRule"("userId");
CREATE UNIQUE INDEX "BudgetCategoryRule_userId_merchantKey_key" ON "BudgetCategoryRule"("userId", "merchantKey");

CREATE UNIQUE INDEX "BudgetTransaction_userId_importFingerprint_key" ON "BudgetTransaction"("userId", "importFingerprint");
CREATE INDEX "BudgetTransaction_userId_importBatchId_idx" ON "BudgetTransaction"("userId", "importBatchId");
CREATE INDEX "BudgetTransaction_userId_merchantKey_idx" ON "BudgetTransaction"("userId", "merchantKey");
