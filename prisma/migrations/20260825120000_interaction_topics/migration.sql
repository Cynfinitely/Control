-- Add optional topic chips on logged interactions

ALTER TABLE "Interaction" ADD COLUMN "topics" TEXT;
