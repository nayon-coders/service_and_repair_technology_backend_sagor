import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';

export const seedLabInventory = async () => {
  console.log('Seeding demo Lab In & Lab Out records...');

  const count = await prisma.labPart.count();
  if (count > 0) {
    console.log(`Already found ${count} lab parts. Skipping seed.`);
    return;
  }

  const admin = await prisma.user.findFirst();

  // 1. Seed Part 1: Halogen Lamp 12V 20W (10 In, 5 Out -> 5 remaining)
  const part1 = await prisma.labPart.create({
    data: {
      name: 'Halogen Lamp 12V 20W',
      partNumber: 'HL-12V-20W',
      unit: 'pcs',
      unitPrice: new Prisma.Decimal(5000),
      stockQuantity: new Prisma.Decimal(5),
      totalInQuantity: new Prisma.Decimal(10),
      totalOutQuantity: new Prisma.Decimal(5),
    },
  });

  await prisma.labIn.create({
    data: {
      date: new Date('2026-06-01'),
      partId: part1.id,
      partsName: part1.name,
      quantity: new Prisma.Decimal(10),
      unitPrice: new Prisma.Decimal(5000),
      totalPrice: new Prisma.Decimal(50000),
      supplier: 'MedTech Optical Importers Ltd.',
      invoiceNo: 'PINV-2026-081',
      remarks: 'OEM Biochemistry analyzer light source lamps',
      createdById: admin?.id || null,
    },
  });

  await prisma.labOut.create({
    data: {
      date: new Date('2026-06-05'),
      partId: part1.id,
      partsName: part1.name,
      quantity: new Prisma.Decimal(5),
      unitPrice: new Prisma.Decimal(5000),
      totalPrice: new Prisma.Decimal(25000),
      dispatchedTo: 'Popular Diagnostic Center (Shantinagar)',
      referenceNo: 'RCE-2026-0001',
      remarks: 'Installed during optical calibration service',
      createdById: admin?.id || null,
    },
  });

  // 2. Seed Part 2: Peristaltic Pump Tubing Kit (8 In, 3 Out -> 5 remaining)
  const part2 = await prisma.labPart.create({
    data: {
      name: 'Peristaltic Pump Tubing Kit (Silicon)',
      partNumber: 'PPT-SIL-02',
      unit: 'set',
      unitPrice: new Prisma.Decimal(2500),
      stockQuantity: new Prisma.Decimal(5),
      totalInQuantity: new Prisma.Decimal(8),
      totalOutQuantity: new Prisma.Decimal(3),
    },
  });

  await prisma.labIn.create({
    data: {
      date: new Date('2026-06-02'),
      partId: part2.id,
      partsName: part2.name,
      quantity: new Prisma.Decimal(8),
      unitPrice: new Prisma.Decimal(2500),
      totalPrice: new Prisma.Decimal(20000),
      supplier: 'BioLab Accessories Dhaka',
      invoiceNo: 'PINV-2026-092',
      remarks: 'High durability peristaltic tubing sets',
      createdById: admin?.id || null,
    },
  });

  await prisma.labOut.create({
    data: {
      date: new Date('2026-06-08'),
      partId: part2.id,
      partsName: part2.name,
      quantity: new Prisma.Decimal(3),
      unitPrice: new Prisma.Decimal(2500),
      totalPrice: new Prisma.Decimal(7500),
      dispatchedTo: 'Labaid Specialized Hospital (Dhanmondi)',
      referenceNo: 'SRV-2026-0034',
      remarks: 'Replaced degraded peristaltic lines',
      createdById: admin?.id || null,
    },
  });

  // 3. Seed Part 3: Sample Probe Assembly (5 In, 1 Out -> 4 remaining)
  const part3 = await prisma.labPart.create({
    data: {
      name: 'Sample Probe Assembly (Titanium Coated)',
      partNumber: 'SPA-TIT-01',
      unit: 'pcs',
      unitPrice: new Prisma.Decimal(8500),
      stockQuantity: new Prisma.Decimal(4),
      totalInQuantity: new Prisma.Decimal(5),
      totalOutQuantity: new Prisma.Decimal(1),
    },
  });

  await prisma.labIn.create({
    data: {
      date: new Date('2026-06-04'),
      partId: part3.id,
      partsName: part3.name,
      quantity: new Prisma.Decimal(5),
      unitPrice: new Prisma.Decimal(8500),
      totalPrice: new Prisma.Decimal(42500),
      supplier: 'MedTech Optical Importers Ltd.',
      invoiceNo: 'PINV-2026-104',
      remarks: 'Precision titanium reagent sample probes',
      createdById: admin?.id || null,
    },
  });

  await prisma.labOut.create({
    data: {
      date: new Date('2026-06-10'),
      partId: part3.id,
      partsName: part3.name,
      quantity: new Prisma.Decimal(1),
      unitPrice: new Prisma.Decimal(8500),
      totalPrice: new Prisma.Decimal(8500),
      dispatchedTo: 'Ibn Sina Hospital (Badda)',
      referenceNo: 'SRV-2026-0041',
      remarks: 'Direct replacement for bent probe tip',
      createdById: admin?.id || null,
    },
  });

  console.log('✅ Seeded demo Lab In & Lab Out records successfully.');
};

if (require.main === module) {
  seedLabInventory()
    .catch((e) => {
      console.error('Failed to seed lab inventory:', e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

