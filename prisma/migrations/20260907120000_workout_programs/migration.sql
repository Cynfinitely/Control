-- Reusable single-session workout programs (reference lists, not dated logs)

CREATE TABLE "WorkoutProgram" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "archivedAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutProgram_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkoutProgram_userId_archivedAt_idx" ON "WorkoutProgram"("userId", "archivedAt");

ALTER TABLE "WorkoutProgram" ADD CONSTRAINT "WorkoutProgram_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WorkoutProgramExercise" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plannedSets" INTEGER NOT NULL,
    "plannedReps" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WorkoutProgramExercise_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkoutProgramExercise_programId_idx" ON "WorkoutProgramExercise"("programId");

ALTER TABLE "WorkoutProgramExercise" ADD CONSTRAINT "WorkoutProgramExercise_programId_fkey" FOREIGN KEY ("programId") REFERENCES "WorkoutProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
