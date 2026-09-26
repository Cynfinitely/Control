-- Food: habit-first logging, Default Meals, per-user food preferences

ALTER TABLE "FoodLogEntry" ALTER COLUMN "meal" DROP NOT NULL;
ALTER TABLE "FoodLogEntry" ALTER COLUMN "meal" DROP DEFAULT;
ALTER TABLE "FoodLogEntry" ADD COLUMN "eatenAt" TIMESTAMP(3);
ALTER TABLE "FoodLogEntry" ADD COLUMN "items" TEXT;
ALTER TABLE "FoodLogEntry" ADD COLUMN "note" TEXT;
ALTER TABLE "FoodLogEntry" ADD COLUMN "hunger" INTEGER;
ALTER TABLE "FoodLogEntry" ADD COLUMN "defaultMealId" TEXT;

ALTER TABLE "MealPlanItem" ALTER COLUMN "meal" DROP NOT NULL;
ALTER TABLE "MealPlanItem" ALTER COLUMN "meal" DROP DEFAULT;
ALTER TABLE "MealPlanItem" ADD COLUMN "defaultMealId" TEXT;

CREATE TABLE "DefaultMeal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "meal" TEXT,
    "calories" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "protein" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carbs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DefaultMeal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DefaultMealItem" (
    "id" TEXT NOT NULL,
    "defaultMealId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DefaultMealItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FoodPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'observe',
    "mealLabels" TEXT NOT NULL DEFAULT E'Meal 1\nMeal 2\nSnack',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodPreference_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DefaultMeal_userId_idx" ON "DefaultMeal"("userId");
CREATE INDEX "DefaultMealItem_defaultMealId_idx" ON "DefaultMealItem"("defaultMealId");
CREATE UNIQUE INDEX "FoodPreference_userId_key" ON "FoodPreference"("userId");
CREATE INDEX "FoodLogEntry_defaultMealId_idx" ON "FoodLogEntry"("defaultMealId");
CREATE INDEX "MealPlanItem_defaultMealId_idx" ON "MealPlanItem"("defaultMealId");

ALTER TABLE "DefaultMeal" ADD CONSTRAINT "DefaultMeal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DefaultMealItem" ADD CONSTRAINT "DefaultMealItem_defaultMealId_fkey" FOREIGN KEY ("defaultMealId") REFERENCES "DefaultMeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodPreference" ADD CONSTRAINT "FoodPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FoodLogEntry" ADD CONSTRAINT "FoodLogEntry_defaultMealId_fkey" FOREIGN KEY ("defaultMealId") REFERENCES "DefaultMeal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MealPlanItem" ADD CONSTRAINT "MealPlanItem_defaultMealId_fkey" FOREIGN KEY ("defaultMealId") REFERENCES "DefaultMeal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
