import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@control.local";
  const adminPassword = "admin1234";

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
    },
  });

  // Default nutrition target for admin
  await prisma.nutritionTarget.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id },
  });

  // A ready-to-use invite code
  const code = "WELCOME-2026";
  await prisma.inviteCode.upsert({
    where: { code },
    update: {},
    create: {
      code,
      maxUses: 5,
      createdById: admin.id,
    },
  });

  console.log("Seed complete.");
  console.log("------------------------------------------");
  console.log("Admin login:");
  console.log(`  Email:    ${adminEmail}`);
  console.log(`  Password: ${adminPassword}`);
  console.log(`Invite code for new sign-ups: ${code}`);
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
