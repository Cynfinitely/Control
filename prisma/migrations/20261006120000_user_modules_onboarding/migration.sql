-- Modules: per-user list of switched-off modules, and a first-run setup flag.
-- Existing users keep every module and are not sent through onboarding.

ALTER TABLE "User" ADD COLUMN "disabledModules" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN "needsOnboarding" BOOLEAN NOT NULL DEFAULT false;
