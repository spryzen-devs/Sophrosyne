import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.telemetry.deleteMany({});
  console.log("Telemetry wiped");
}
main().catch(console.error).finally(() => prisma.$disconnect());
