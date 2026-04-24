import { Department, Prisma, PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordAdmin = await bcrypt.hash('Admin@1234', 10);
  const passwordUser = await bcrypt.hash('User@1234', 10);

  // Reset the local demo database so the seeded environment stays predictable.
  await prisma.loeEntry.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.loeSheet.deleteMany();
  await prisma.allocation.deleteMany();
  await prisma.fixedCategory.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      email: 'admin@company.com',
      password: passwordAdmin,
      name: 'Admin User',
      role: Role.ADMIN,
      position: 'Administrator',
      department: Department.ENGINEERING,
      country: 'Pakistan',
      city: 'Karachi',
      reviewerId: null,
    },
  });

  const user = await prisma.user.create({
    data: {
      email: 'user@company.com',
      password: passwordUser,
      name: 'Sample User',
      role: Role.USER,
      position: 'Software Engineer',
      department: Department.ENGINEERING,
      country: 'Pakistan',
      city: 'Karachi',
      reviewerId: admin.id,
    },
  });

  const projects = await Promise.all([
    prisma.project.create({
      data: {
        code: 'APOLLO',
        name: 'Apollo Modernization',
        description: 'Core delivery project for the seeded user flow.',
      },
    }),
    prisma.project.create({
      data: {
        code: 'ORBIT',
        name: 'Orbit Analytics',
        description: 'Secondary project used for allocation and LOE entry testing.',
      },
    }),
  ]);

  await Promise.all([
    prisma.fixedCategory.create({
      data: {
        code: 'TIME_OFF',
        name: 'Time-Off',
      },
    }),
    prisma.fixedCategory.create({
      data: {
        code: 'BENCH',
        name: 'Open to New Projects',
      },
    }),
    prisma.fixedCategory.create({
      data: {
        code: 'OTHER',
        name: 'Other',
      },
    }),
  ]);

  await Promise.all([
    prisma.allocation.create({
      data: {
        userId: user.id,
        projectId: projects[0].id,
        assignedById: admin.id,
        percentage: new Prisma.Decimal(70),
      },
    }),
    prisma.allocation.create({
      data: {
        userId: user.id,
        projectId: projects[1].id,
        assignedById: admin.id,
        percentage: new Prisma.Decimal(30),
      },
    }),
  ]);

  console.log('Seeded a clean demo environment with one admin, one user, sample projects, fixed categories, and allocations.');
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
