import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';

export const seedSalary = async () => {
  console.log('Seeding demo Salary Records from official spreadsheet...');

  const count = await prisma.salaryRecord.count();
  if (count > 0) {
    console.log(`Already found ${count} salary records. Skipping seed.`);
    return;
  }

  const admin = await prisma.user.findFirst();

  // 1. Ensure the 4 spreadsheet employees exist in Employee table
  const employeesToEnsure = [
    {
      employeeId: '7141',
      name: 'Sagar Badsha',
      email: 'sagar@oneservice.com',
      designation: 'Lead Engineer',
      department: 'Biomedical',
      basicSalary: new Prisma.Decimal(20000),
      allowance: new Prisma.Decimal(500),
      grossSalary: new Prisma.Decimal(20500),
    },
    {
      employeeId: '7142',
      name: 'MD Maher',
      email: 'maher@oneservice.com',
      designation: 'Accounts & IT',
      department: 'Office',
      basicSalary: new Prisma.Decimal(10000),
      allowance: new Prisma.Decimal(0),
      grossSalary: new Prisma.Decimal(10000),
    },
    {
      employeeId: '7143',
      name: 'Biplob Chandra Shil',
      email: 'biplob@oneservice.com',
      designation: 'Engineer',
      department: 'Biomedical',
      basicSalary: new Prisma.Decimal(6000),
      allowance: new Prisma.Decimal(0),
      grossSalary: new Prisma.Decimal(6000),
    },
    {
      employeeId: '7144',
      name: 'Benzir Ahmed',
      email: 'benzir@oneservice.com',
      designation: 'Engineer',
      department: 'Biomedical',
      basicSalary: new Prisma.Decimal(5000),
      allowance: new Prisma.Decimal(0),
      grossSalary: new Prisma.Decimal(5000),
    },
  ];

  const empMap: Record<string, string> = {};
  for (const emp of employeesToEnsure) {
    const upserted = await prisma.employee.upsert({
      where: { employeeId: emp.employeeId },
      update: {
        name: emp.name,
        designation: emp.designation,
        department: emp.department,
        basicSalary: emp.basicSalary,
        allowance: emp.allowance,
        grossSalary: emp.grossSalary,
      },
      create: {
        ...emp,
        createdById: admin?.id || null,
      },
    });
    empMap[emp.employeeId] = upserted.id;
  }

  // 2. Seed the exact 4 records from Jun 2026 Salary Sheet
  const sheetRecords = [
    {
      month: 'Jun 2026',
      employeeIdRef: empMap['7141'],
      employeeName: 'Sagar Badsha',
      employeeCode: '7141',
      designation: 'Lead Engineer',
      department: 'Biomedical',
      basicSalary: new Prisma.Decimal(20000),
      allowance: new Prisma.Decimal(500),
      totalDays: 30,
      presentDays: 28,
      absentDays: 2,
      totalEarnings: new Prisma.Decimal(18666.00),
      advanceLoan: new Prisma.Decimal(0.00),
      previousDue: new Prisma.Decimal(36500.00),
      netPayable: new Prisma.Decimal(18666.00),
      paidAmount: new Prisma.Decimal(0.00),
      dueAmount: new Prisma.Decimal(55166.00),
      paymentStatus: 'UNPAID' as const,
      paymentMethod: 'Cash',
      paymentDate: null,
      notes: 'Carried forward previous month due ৳36,500.',
      createdById: admin?.id || null,
    },
    {
      month: 'Jun 2026',
      employeeIdRef: empMap['7142'],
      employeeName: 'MD Maher',
      employeeCode: '7142',
      designation: 'Accounts & IT',
      department: 'Office',
      basicSalary: new Prisma.Decimal(10000),
      allowance: new Prisma.Decimal(0),
      totalDays: 30,
      presentDays: 26,
      absentDays: 4,
      totalEarnings: new Prisma.Decimal(8666.00),
      advanceLoan: new Prisma.Decimal(0.00),
      previousDue: new Prisma.Decimal(0.00),
      netPayable: new Prisma.Decimal(8666.00),
      paidAmount: new Prisma.Decimal(666.00),
      dueAmount: new Prisma.Decimal(8000.00),
      paymentStatus: 'PARTIAL' as const,
      paymentMethod: 'Bank Transfer',
      paymentDate: new Date('2026-06-05'),
      notes: 'Partial advance paid ৳666, balance ৳8,000 due.',
      createdById: admin?.id || null,
    },
    {
      month: 'Jun 2026',
      employeeIdRef: empMap['7143'],
      employeeName: 'Biplob Chandra Shil',
      employeeCode: '7143',
      designation: 'Engineer',
      department: 'Biomedical',
      basicSalary: new Prisma.Decimal(6000),
      allowance: new Prisma.Decimal(0),
      totalDays: 30,
      presentDays: 16,
      absentDays: 14,
      totalEarnings: new Prisma.Decimal(3200.00),
      advanceLoan: new Prisma.Decimal(550.00),
      previousDue: new Prisma.Decimal(0.00),
      netPayable: new Prisma.Decimal(2650.00),
      paidAmount: new Prisma.Decimal(2650.00),
      dueAmount: new Prisma.Decimal(0.00),
      paymentStatus: 'PAID' as const,
      paymentMethod: 'Cash',
      paymentDate: new Date('2026-06-05'),
      notes: 'Advance loan ৳550 deducted; net ৳2,650 fully settled.',
      createdById: admin?.id || null,
    },
    {
      month: 'Jun 2026',
      employeeIdRef: empMap['7144'],
      employeeName: 'Benzir Ahmed',
      employeeCode: '7144',
      designation: 'Engineer',
      department: 'Biomedical',
      basicSalary: new Prisma.Decimal(5000),
      allowance: new Prisma.Decimal(0),
      totalDays: 30,
      presentDays: 22,
      absentDays: 8,
      totalEarnings: new Prisma.Decimal(3666.00),
      advanceLoan: new Prisma.Decimal(0.00),
      previousDue: new Prisma.Decimal(0.00),
      netPayable: new Prisma.Decimal(3666.00),
      paidAmount: new Prisma.Decimal(3666.00),
      dueAmount: new Prisma.Decimal(0.00),
      paymentStatus: 'PAID' as const,
      paymentMethod: 'bKash',
      paymentDate: new Date('2026-06-05'),
      notes: 'Disbursed via bKash personal wallet.',
      createdById: admin?.id || null,
    },
  ];

  for (const s of sheetRecords) {
    await prisma.salaryRecord.create({
      data: s,
    });
  }

  console.log('✅ Seeded 4 Jun 2026 Salary Sheet records successfully.');
};

if (require.main === module) {
  seedSalary()
    .catch((e) => {
      console.error('Failed to seed salary records:', e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

