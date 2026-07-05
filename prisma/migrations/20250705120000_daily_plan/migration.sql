-- Daily plan: blocks, templates, suggestion dismissals

CREATE TABLE "PlanBlock" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planDate" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'custom',
    "status" TEXT NOT NULL DEFAULT 'planned',
    "linkType" TEXT,
    "linkId" TEXT,
    "color" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanBlock_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlanTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlanTemplateBlock" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'custom',
    "linkType" TEXT,
    "color" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PlanTemplateBlock_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlanSuggestionDismissal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planDate" TIMESTAMP(3) NOT NULL,
    "suggestionKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanSuggestionDismissal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlanBlock_userId_planDate_idx" ON "PlanBlock"("userId", "planDate");
CREATE INDEX "PlanBlock_userId_linkType_linkId_idx" ON "PlanBlock"("userId", "linkType", "linkId");
CREATE INDEX "PlanTemplate_userId_idx" ON "PlanTemplate"("userId");
CREATE INDEX "PlanTemplateBlock_templateId_idx" ON "PlanTemplateBlock"("templateId");
CREATE INDEX "PlanSuggestionDismissal_userId_planDate_idx" ON "PlanSuggestionDismissal"("userId", "planDate");
CREATE UNIQUE INDEX "PlanSuggestionDismissal_userId_planDate_suggestionKey_key" ON "PlanSuggestionDismissal"("userId", "planDate", "suggestionKey");

ALTER TABLE "PlanBlock" ADD CONSTRAINT "PlanBlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlanTemplate" ADD CONSTRAINT "PlanTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlanTemplateBlock" ADD CONSTRAINT "PlanTemplateBlock_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PlanTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlanSuggestionDismissal" ADD CONSTRAINT "PlanSuggestionDismissal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
