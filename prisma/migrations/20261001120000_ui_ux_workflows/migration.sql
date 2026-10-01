-- UI/UX pass: start workouts from programs, mark planned meals as logged, guided weekly review

ALTER TABLE "Workout" ADD COLUMN "programId" TEXT;
ALTER TABLE "WorkoutExercise" ADD COLUMN "plannedSets" INTEGER;
ALTER TABLE "WorkoutExercise" ADD COLUMN "plannedReps" INTEGER;
ALTER TABLE "MealPlanItem" ADD COLUMN "loggedAt" TIMESTAMP(3);

CREATE TABLE "WeeklyReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekKey" TEXT NOT NULL,
    "completedSteps" TEXT NOT NULL DEFAULT '',
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyReview_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Workout_programId_idx" ON "Workout"("programId");
CREATE UNIQUE INDEX "WeeklyReview_userId_weekKey_key" ON "WeeklyReview"("userId", "weekKey");
CREATE INDEX "WeeklyReview_userId_completedAt_idx" ON "WeeklyReview"("userId", "completedAt");

ALTER TABLE "Workout" ADD CONSTRAINT "Workout_programId_fkey" FOREIGN KEY ("programId") REFERENCES "WorkoutProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WeeklyReview" ADD CONSTRAINT "WeeklyReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
