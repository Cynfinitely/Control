import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DEV_PASSWORD = "admin1234";

/** True for anything that is not a local development database. */
function isRealDeployment(): boolean {
  if (process.env.NODE_ENV === "production") return true;
  const url = process.env.DATABASE_URL ?? "";
  if (!/^postgres(ql)?:\/\//.test(url)) return false;
  return !/@(localhost|127\.0\.0\.1)[:/]/.test(url);
}

async function main() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@control.local").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? DEV_PASSWORD;

  // The development password is public (it is in the README), so it must never
  // reach a real deployment.
  if (isRealDeployment() && (adminPassword === DEV_PASSWORD || adminPassword.length < 12)) {
    throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (12+ characters) before seeding a production database.");
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Admin",
      passwordHash,
      role: "admin",
      emailVerifiedAt: new Date(),
      needsOnboarding: true,
    },
  });

  // Default nutrition target for admin
  await prisma.nutritionTarget.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id },
  });

  console.log("Seed complete.");
  console.log("------------------------------------------");
  console.log(`Admin login: ${adminEmail}`);
  console.log(adminPassword === DEV_PASSWORD ? `Password:    ${DEV_PASSWORD} (development only)` : "Password:    from SEED_ADMIN_PASSWORD");
  console.log("Invite people from Admin > Invite a person.");
  console.log("------------------------------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
