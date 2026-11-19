import { prisma } from '../config/prisma';

export const seedSampleVouchers = async (): Promise<void> => {
  console.log('🌱 Seeding realistic Bill Vouchers...');

  const count = await prisma.billVoucher.count();
  if (count > 0) {
    console.log(`ℹ️ Bill vouchers already exist (${count} records). Skipping seed.`);
    return;
  }

  // 1. Corporate Voucher: Medilife Diagnostic & Hospital
  await prisma.billVoucher.create({
    data: {
      voucherNo: 'BV-2026-0001',
      date: new Date('2026-06-12'),
      customerType: 'CORPORATE',
      billType: 'REPAIR',
      customerName: 'Medilife Hospital & Diagnostic Complex',
      mobile: '01712-345678',
      address: 'House #14, Road #07, Dhanmondi, Dhaka-1205',
      machineName: 'Patient Monitor (BeneView Series)',
      brandModel: 'Mindray BeneView T5',
      serialNo: 'MN-9924-A1',
      department: 'ICU / CCU',
      problemComplaint: 'Power supply board malfunctioning & main display backlight flickering.',
      receivedDate: new Date('2026-06-10'),
      partsTotal: 23000,
      serviceCharge: 10000,
      discount: 0,
      grandTotal: 33000,
      paidAmount: 33000,
      dueAmount: 0,
      amountInWords: 'Thirty-Three Thousand Taka Only',
      warrantyTerms: '1 year Panel Service Warranty',
      paymentStatus: 'PAID',
      paymentMethod: 'BANK',
      preparedBy: 'Engr. Sagor Badsha',
      items: {
        create: [
          {
            sl: 1,
            description: 'Main SMPS Power Supply Board Replacement',
            qty: 1,
            unitPrice: 18000,
            amount: 18000,
            remarks: 'Original OEM Board',
          },
          {
            sl: 2,
            description: 'High Voltage Inverter & Capacitor Kit',
            qty: 2,
            unitPrice: 2500,
            amount: 5000,
            remarks: 'Replaced with 105°C rating',
          },
        ],
      },
    },
  });

  // 2. Corporate Voucher: Evercare Fitness & Rehabilitation
  await prisma.billVoucher.create({
    data: {
      voucherNo: 'BV-2026-0002',
      date: new Date('2026-06-15'),
      customerType: 'CORPORATE',
      billType: 'BOTH',
      customerName: 'FitZone Gym & Wellness Center',
      mobile: '01844-998822',
      address: 'Plot 45, Gulshan-2, Dhaka',
      machineName: 'Commercial AC Motor Treadmill',
      brandModel: 'Shua SH-5918 Heavy Duty',
      serialNo: 'SH-8841-2023',
      department: 'Cardio Section',
      problemComplaint: 'Running belt torn, roller bearing noise & inverter error E-02.',
      receivedDate: new Date('2026-06-13'),
      partsTotal: 14500,
      serviceCharge: 3500,
      discount: 500,
      grandTotal: 17500,
      paidAmount: 10000,
      dueAmount: 7500,
      amountInWords: 'Seventeen Thousand Five Hundred Taka Only',
      warrantyTerms: '6 months running belt warranty',
      paymentStatus: 'PARTIAL',
      paymentMethod: 'BKASH',
      preparedBy: 'Engr. Sagor Badsha',
      items: {
        create: [
          {
            sl: 1,
            description: 'Commercial Multi-ply Treadmill Running Belt (3.2mm)',
            qty: 1,
            unitPrice: 8500,
            amount: 8500,
            remarks: 'Anti-static coated',
          },
          {
            sl: 2,
            description: 'Heavy Duty Front & Rear Roller Bearings (NSK Japan)',
            qty: 2,
            unitPrice: 2000,
            amount: 4000,
            remarks: 'Pair replaced',
          },
          {
            sl: 3,
            description: 'Optocoupler Sensor & Inverter Calibration',
            qty: 1,
            unitPrice: 2000,
            amount: 2000,
            remarks: 'Speed sensor adjusted',
          },
        ],
      },
    },
  });

  // 3. Non-Corporate Voucher: Dr. Rafiqul Islam (Private Clinic / Personal)
  await prisma.billVoucher.create({
    data: {
      voucherNo: 'BV-2026-0003',
      date: new Date('2026-06-16'),
      customerType: 'NON_CORPORATE',
      billType: 'SERVICE',
      customerName: 'Dr. Rafiqul Islam (Islam Dental Care)',
      mobile: '01911-552233',
      address: 'Mirpur-10, Dhaka',
      machineName: 'Dental Autoclave Sterilizer (Class B)',
      brandModel: 'Runyes SEA-23L-B-LED',
      serialNo: 'RY-2022-771',
      department: 'Sterilization Room',
      problemComplaint: 'Pressure build-up failure and door seal gasket leaking steam.',
      receivedDate: new Date('2026-06-14'),
      partsTotal: 4500,
      serviceCharge: 3500,
      discount: 0,
      grandTotal: 8000,
      paidAmount: 8000,
      dueAmount: 0,
      amountInWords: 'Eight Thousand Taka Only',
      warrantyTerms: '3 months seal gasket warranty',
      paymentStatus: 'PAID',
      paymentMethod: 'CASH',
      preparedBy: 'Engr. Sagor Badsha',
      items: {
        create: [
          {
            sl: 1,
            description: 'Medical Grade Silicone Door Seal Gasket 23L',
            qty: 1,
            unitPrice: 3500,
            amount: 3500,
            remarks: 'Autoclave resistant',
          },
          {
            sl: 2,
            description: 'Solenoid Release Valve O-Ring Kit',
            qty: 1,
            unitPrice: 1000,
            amount: 1000,
            remarks: 'Replaced & tested at 134°C',
          },
        ],
      },
    },
  });

  console.log('✅ Seeded 3 realistic Bill Vouchers with line items and exact financial breakdowns.');
};

if (require.main === module) {
  seedSampleVouchers()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

