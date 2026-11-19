import { prisma } from '../config/prisma';

export const seedSampleTaDaBills = async (): Promise<void> => {
  console.log('🌱 Seeding realistic TA/DA Bills...');

  const count = await prisma.taDaBill.count();
  if (count > 0) {
    console.log(`ℹ️ TA/DA bills already exist (${count} records). Skipping seed.`);
    return;
  }

  // 1. Engr. Tanvir Ahmed (Service Engineer)
  await prisma.taDaBill.create({
    data: {
      billNo: 'TADA-2026-0001',
      submissionDate: new Date('2026-06-15'),
      employeeName: 'Engr. Tanvir Ahmed',
      designation: 'Senior Biomedical Service Engineer',
      employeeId: 'EMP-102',
      department: 'Biomedical Service & Field Support',
      totalAmount: 1850,
      status: 'APPROVED',
      receivedBy: 'Engr. Sagor Badsha',
      checkedBy: 'Md. Al-Amin (Accounts)',
      approvedBy: 'Engr. Sagor Badsha (Chief Engineer)',
      remarks: 'Hospital emergency repair visit for Mindray Chemistry Analyzer.',
      items: {
        create: [
          {
            sl: 1,
            date: new Date('2026-06-10'),
            particular: 'Workshop (Badda) to Popular Diagnostic Shantinagar (Sensor replacement visit)',
            vehicleName: 'CNG Auto',
            qty: 1,
            unitTaka: 350,
            totalTaka: 350,
            checkedBy: 'Admin',
          },
          {
            sl: 2,
            date: new Date('2026-06-10'),
            particular: 'Field Technical Lunch Allowance (Full Day Service)',
            vehicleName: 'N/A',
            qty: 1,
            unitTaka: 250,
            totalTaka: 250,
            checkedBy: 'Admin',
          },
          {
            sl: 3,
            date: new Date('2026-06-12'),
            particular: 'Badda to Square Hospital Panthapath (Patient Monitor SMPS checking)',
            vehicleName: 'Uber Moto',
            qty: 1,
            unitTaka: 220,
            totalTaka: 220,
            checkedBy: 'Admin',
          },
          {
            sl: 4,
            date: new Date('2026-06-12'),
            particular: 'Square Hospital to National Heart Foundation Mirpur',
            vehicleName: 'CNG Auto',
            qty: 1,
            unitTaka: 400,
            totalTaka: 400,
            checkedBy: 'Admin',
          },
          {
            sl: 5,
            date: new Date('2026-06-13'),
            particular: 'Return from Mirpur to Workshop with heavy calibrator kit',
            vehicleName: 'CNG Auto',
            qty: 1,
            unitTaka: 380,
            totalTaka: 380,
            checkedBy: 'Admin',
          },
          {
            sl: 6,
            date: new Date('2026-06-13'),
            particular: 'Evening Field Refreshment Allowance',
            vehicleName: 'N/A',
            qty: 1,
            unitTaka: 250,
            totalTaka: 250,
            checkedBy: 'Admin',
          },
        ],
      },
    },
  });

  // 2. Md. Rafiqul Islam (Senior Dispatcher / Logistics)
  await prisma.taDaBill.create({
    data: {
      billNo: 'TADA-2026-0002',
      submissionDate: new Date('2026-06-18'),
      employeeName: 'Md. Rafiqul Islam',
      designation: 'Logistics & Dispatch Officer',
      employeeId: 'EMP-104',
      department: 'Logistics & Material Transport',
      totalAmount: 1100,
      status: 'PAID',
      receivedBy: 'Engr. Sagor Badsha',
      checkedBy: 'Md. Al-Amin (Accounts)',
      approvedBy: 'Engr. Sagor Badsha',
      remarks: 'Machine gate pass collection & spare parts delivery conveyance.',
      items: {
        create: [
          {
            sl: 1,
            date: new Date('2026-06-16'),
            particular: 'Workshop to Nawabpur electronics market for SMPS components & transistors',
            vehicleName: 'Bus & Rickshaw',
            qty: 2,
            unitTaka: 150,
            totalTaka: 300,
            checkedBy: 'Admin',
          },
          {
            sl: 2,
            date: new Date('2026-06-17'),
            particular: 'Emergency sample delivery to Popular Diagnostic Center Unit 2',
            vehicleName: 'Rickshaw',
            qty: 1,
            unitTaka: 180,
            totalTaka: 180,
            checkedBy: 'Admin',
          },
          {
            sl: 3,
            date: new Date('2026-06-17'),
            particular: 'Transport of standby dental scaler to Dr. Mahbubur Rahman chamber Dhanmondi',
            vehicleName: 'CNG Auto',
            qty: 1,
            unitTaka: 420,
            totalTaka: 420,
            checkedBy: 'Admin',
          },
          {
            sl: 4,
            date: new Date('2026-06-17'),
            particular: 'Daily Conveyance & Lunch Allowance',
            vehicleName: 'N/A',
            qty: 1,
            unitTaka: 200,
            totalTaka: 200,
            checkedBy: 'Admin',
          },
        ],
      },
    },
  });

  // 3. Md. Kamrul Hasan (Assistant Technician)
  await prisma.taDaBill.create({
    data: {
      billNo: 'TADA-2026-0003',
      submissionDate: new Date('2026-06-20'),
      employeeName: 'Md. Kamrul Hasan',
      designation: 'Assistant Electronics Technician',
      employeeId: 'EMP-108',
      department: 'Workshop Maintenance',
      totalAmount: 650,
      status: 'PENDING',
      receivedBy: 'Engr. Sagor Badsha',
      checkedBy: null,
      approvedBy: null,
      remarks: 'Courier collection and soldering consumable procurement.',
      items: {
        create: [
          {
            sl: 1,
            date: new Date('2026-06-19'),
            particular: 'Workshop to Sundarban Courier Motijheel branch (Collect imported probe package)',
            vehicleName: 'Bus / Rickshaw',
            qty: 1,
            unitTaka: 250,
            totalTaka: 250,
            checkedBy: 'Admin',
          },
          {
            sl: 2,
            date: new Date('2026-06-19'),
            particular: 'Stadium market for medical thermal paste & copper wire',
            vehicleName: 'Rickshaw',
            qty: 1,
            unitTaka: 200,
            totalTaka: 200,
            checkedBy: 'Admin',
          },
          {
            sl: 3,
            date: new Date('2026-06-19'),
            particular: 'Lunch & Tiffin Allowance',
            vehicleName: 'N/A',
            qty: 1,
            unitTaka: 200,
            totalTaka: 200,
            checkedBy: 'Admin',
          },
        ],
      },
    },
  });

  console.log('✅ 3 realistic TA/DA Bills seeded successfully.');
};

if (require.main === module) {
  seedSampleTaDaBills()
    .catch((err) => {
      console.error('❌ Error seeding TA/DA bills:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

