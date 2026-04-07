const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123!', 10);
  await prisma.user.upsert({
    where: { email: 'admin@teampl.com' },
    update: {},
    create: {
      email: 'admin@teampl.com',
      password: adminPassword,
      name: '최고 관리자',
      department: '운영팀',
      studentId: 'ADMIN-001',
    },
  });

  console.log('✅ Auto-Seeding: Admin users seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
