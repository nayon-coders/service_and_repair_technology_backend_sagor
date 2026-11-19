import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';

export const seedOfficeRent = async () => {
  console.log('Seeding demo Office Rent records...');

  const count = await prisma.officeRent.count();
  if (count > 0) {
    console.log(`Already found ${count} office rent records. Skipping seed.`);
    return;
  }

  const admin = await prisma.user.findFirst();

  const demoRecords = [
    {
      month: 'May 2026',
      title: 'Office rent',
      amount: new Prisma.Decimal(35000),
      status: 'PAID' as const,
      paymentDate: new Date('2026-05-05'),
      paymentMethod: 'Bank Transfer',
      landlordName: 'Al-Haj Abdul Latif (Premise Owner)',
      receiptNo: 'RENT-REC-2026-05',
      note: 'Plot No 02, Road No 12, DIT Project, Middle Badda office premises.',
      createdById: admin?.id || null,
    },
    {
      month: 'June 2026',
      title: 'Office rent',
      amount: new Prisma.Decimal(35000),
      status: 'PAID' as const,
      paymentDate: new Date('2026-06-03'),
      paymentMethod: 'Cheque',
      landlordName: 'Al-Haj Abdul Latif (Premise Owner)',
      receiptNo: 'RENT-REC-2026-06',
      note: 'Paid via City Bank cheque #CB-7749102.',
      createdById: admin?.id || null,
    },
    {
      month: 'July 2026',
      title: 'Office rent',
      amount: new Prisma.Decimal(35000),
      status: 'UNPAID' as const,
      paymentDate: null,
      paymentMethod: null,
      landlordName: 'Al-Haj Abdul Latif (Premise Owner)',
      receiptNo: null,
      note: 'Current monthly office space rental invoice due.',
      createdById: admin?.id || null,
    },
  ];

  for (const rec of demoRecords) {
    await prisma.officeRent.create({
      data: rec,
    });
  }

  console.log('✅ Seeded 3 demo Office Rent records successfully.');
};

if (require.main === module) {
  seedOfficeRent()
    .catch((e) => {
      console.error('Failed to seed office rent:', e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

