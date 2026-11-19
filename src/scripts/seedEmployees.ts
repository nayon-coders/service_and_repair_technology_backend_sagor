import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';

export const seedEmployees = async () => {
  console.log('Seeding demo Employees...');

  const count = await prisma.employee.count();
  if (count > 0) {
    console.log(`Already found ${count} employees. Skipping seed.`);
    return;
  }

  const admin = await prisma.user.findFirst();

  const demoEmployees = [
    {
      employeeId: 'EMP-001',
      name: 'Engr. Tanvir Ahmed',
      email: 'tanvir@oneservice.com',
      phone: '+880 1778-116244',
      designation: 'Senior Biomedical Engineer',
      department: 'Service & Maintenance',
      basicSalary: new Prisma.Decimal(35000),
      allowance: new Prisma.Decimal(5000), // Mobile & other allowance
      grossSalary: new Prisma.Decimal(40000),
      joinDate: new Date('2024-01-15'),
      status: 'ACTIVE' as const,
      address: 'Plot 02, Road 12, DIT Project, Middle Badda, Dhaka',
      notes: 'Expert in Chemistry Analyzer and Optical alignment.',
      createdById: admin?.id || null,
    },
    {
      employeeId: 'EMP-002',
      name: 'Md. Rafiqul Islam',
      email: 'rafiqul@oneservice.com',
      phone: '+880 1540-081230',
      designation: 'Senior Lab Technologist',
      department: 'Diagnostic Lab Operations',
      basicSalary: new Prisma.Decimal(28000),
      allowance: new Prisma.Decimal(4000),
      grossSalary: new Prisma.Decimal(32000),
      joinDate: new Date('2024-06-01'),
      status: 'ACTIVE' as const,
      address: 'House 45, Road 8, Rampura, Dhaka',
      notes: 'Manages incoming diagnostic specimen calibration.',
      createdById: admin?.id || null,
    },
    {
      employeeId: 'EMP-003',
      name: 'Md. Kamrul Hasan',
      email: 'kamrul@oneservice.com',
      phone: '+880 1715-998811',
      designation: 'Store & Inventory Officer',
      department: 'Inventory & Logistics',
      basicSalary: new Prisma.Decimal(22000),
      allowance: new Prisma.Decimal(3000),
      grossSalary: new Prisma.Decimal(25000),
      joinDate: new Date('2025-02-10'),
      status: 'ACTIVE' as const,
      address: 'North Badda, Gulshan, Dhaka',
      notes: 'Oversees Lab In & Lab Out parts stock movements.',
      createdById: admin?.id || null,
    },
    {
      employeeId: 'EMP-004',
      name: 'Nasrin Akter',
      email: 'nasrin@oneservice.com',
      phone: '+880 1822-445566',
      designation: 'Customer Service Executive',
      department: 'Customer Support',
      basicSalary: new Prisma.Decimal(20000),
      allowance: new Prisma.Decimal(2500),
      grossSalary: new Prisma.Decimal(22500),
      joinDate: new Date('2025-05-01'),
      status: 'ACTIVE' as const,
      address: 'Niketan, Gulshan-1, Dhaka',
      notes: 'Handles corporate client billing inquiries and appointments.',
      createdById: admin?.id || null,
    },
  ];

  for (const emp of demoEmployees) {
    await prisma.employee.create({
      data: emp,
    });
  }

  console.log('✅ Seeded 4 demo Employees successfully.');
};

if (require.main === module) {
  seedEmployees()
    .catch((e) => {
      console.error('Failed to seed employees:', e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

