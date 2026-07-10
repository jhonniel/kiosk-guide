import { PrismaClient } from "@prisma/client";
import { applyBisayaContent } from "../prisma/apply-bisaya-content";

const prisma = new PrismaClient();

async function main() {
  await applyBisayaContent(prisma);
  console.log("Cebuano content backfilled successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
