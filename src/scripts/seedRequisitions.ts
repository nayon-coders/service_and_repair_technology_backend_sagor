import { prisma } from '../config/prisma';

export const seedSampleRequisitions = async (): Promise<void> => {
  console.log('🌱 Seeding realistic Requisitions (Repair Cost Estimates)...');

  const count = await prisma.requisition.count();
  if (count > 0) {
    console.log(`ℹ️ Requisitions already exist (${count} records). Skipping seed.`);
    return;
  }

  // 1. Corporate: Popular Diagnostic Center Ltd.
  await prisma.requisition.create({
    data: {
      estimateNo: 'RCE-2026-0001',
      date: new Date('2026-06-18'),
      validUpTo: new Date('2026-07-18'),
      customerType: 'CORPORATE',
      organizationName: 'Popular Diagnostic Center Ltd. (Shantinagar)',
      departmentWard: 'Biochemistry & Pathology Lab',
      contactPerson: 'Dr. Anwarul Haque (Lab Director)',
      contactNo: '01715-998811',
      equipmentName: 'Fully Automated Chemistry Analyzer',
      brand: 'Mindray',
      model: 'BS-240',
      serialNo: 'BS-88390-D',
      faultDescription: 'Photometer optical sensor deviation, reagent sample probe clogged & peristaltic pump pressure failure.',
      sparePartsTotal: 18500,
      serviceLabourTotal: 6500,
      subTotal: 25000,
      discount: 1000,
      grandTotal: 24000,
      status: 'APPROVED',
      preparedBy: '1 Service & Repair Technology.',
      clientApprovalNote: 'Approved by Dr. Anwarul Haque for procurement & service.',
      items: {
        create: [
          {
            category: 'SPARE_PARTS',
            sl: 1,
            description: 'Sample & Reagent Probe Assembly (Titanium Coated)',
            qty: 1,
            unitPrice: 8500,
            totalPrice: 8500,
            remarks: 'Repairable',
          },
          {
            category: 'SPARE_PARTS',
            sl: 2,
            description: 'Optical Filter & Halogen Lamp 12V 20W',
            qty: 1,
            unitPrice: 5000,
            totalPrice: 5000,
            remarks: 'OEM Part',
          },
          {
            category: 'SPARE_PARTS',
            sl: 3,
            description: 'Peristaltic Pump Tubing Kit (Silicon)',
            qty: 2,
            unitPrice: 2500,
            totalPrice: 5000,
            remarks: 'Imported',
          },
          {
            category: 'SERVICE_LABOUR',
            sl: 1,
            description: 'Complete Optical System Calibration & Probe Alignment Service',
            qty: 1,
            unitPrice: 6500,
            totalPrice: 6500,
            remarks: 'Service Charge',
          },
        ],
      },
    },
  });

  // 2. Corporate: Labaid Specialized Hospital
  await prisma.requisition.create({
    data: {
      estimateNo: 'RCE-2026-0002',
      date: new Date('2026-06-20'),
      validUpTo: new Date('2026-07-20'),
      customerType: 'CORPORATE',
      organizationName: 'Labaid Specialized Hospital (Dhanmondi)',
      departmentWard: 'Coronary Care Unit (CCU)',
      contactPerson: 'Engr. Mizanur Rahman (Biomedical Engr.)',
      contactNo: '01819-445566',
      equipmentName: 'Multi-parameter Patient Monitor with Defibrillator',
      brand: 'Philips',
      model: 'IntelliVue MP50',
      serialNo: 'PH-MP50-449',
      faultDescription: 'ECG channel lead-off error, NIBP module cuff inflation failure & internal lithium backup battery dead.',
      sparePartsTotal: 29000,
      serviceLabourTotal: 5000,
      subTotal: 34000,
      discount: 0,
      grandTotal: 34000,
      status: 'PENDING',
      preparedBy: '1 Service & Repair Technology.',
      items: {
        create: [
          {
            category: 'SPARE_PARTS',
            sl: 1,
            description: 'NIBP Air Pump & Exhaust Solenoid Valve Module',
            qty: 1,
            unitPrice: 16000,
            totalPrice: 16000,
            remarks: 'Repairable',
          },
          {
            category: 'SPARE_PARTS',
            sl: 2,
            description: 'Internal Rechargeable Medical Battery Pack (10.8V Li-ion)',
            qty: 1,
            unitPrice: 9500,
            totalPrice: 9500,
            remarks: 'Original Philips',
          },
          {
            category: 'SPARE_PARTS',
            sl: 3,
            description: '5-Lead ECG Trunk Cable & Leadwire Set',
            qty: 1,
            unitPrice: 3500,
            totalPrice: 3500,
            remarks: 'OEM Leadwire',
          },
          {
            category: 'SERVICE_LABOUR',
            sl: 1,
            description: 'NIBP Pressure Transducer Calibration & PCB Overhaul',
            qty: 1,
            unitPrice: 5000,
            totalPrice: 5000,
            remarks: 'Labour Service',
          },
        ],
      },
    },
  });

  // 3. Non-Corporate: Modern Dental & Oral Surgery Clinic
  await prisma.requisition.create({
    data: {
      estimateNo: 'RCE-2026-0003',
      date: new Date('2026-06-21'),
      validUpTo: new Date('2026-07-21'),
      customerType: 'NON_CORPORATE',
      organizationName: 'Dr. Shahin Dental Surgery (Uttara Sector 7)',
      departmentWard: 'Dental Operatory 1',
      contactPerson: 'Dr. Shahinur Rahman',
      contactNo: '01912-887766',
      equipmentName: 'Dental Chair Hydraulic & Compressor Unit',
      brand: 'Sirona (Dentsply)',
      model: 'Intego Pro',
      serialNo: 'SR-2021-99',
      faultDescription: 'Hydraulic lift valve leaking oil, foot controller switch unresponsive.',
      sparePartsTotal: 12000,
      serviceLabourTotal: 4000,
      subTotal: 16000,
      discount: 500,
      grandTotal: 15500,
      status: 'APPROVED',
      preparedBy: '1 Service & Repair Technology.',
      items: {
        create: [
          {
            category: 'SPARE_PARTS',
            sl: 1,
            description: 'High Pressure Hydraulic Valve & Seal Gasket Kit',
            qty: 1,
            unitPrice: 8500,
            totalPrice: 8500,
            remarks: 'Repairable',
          },
          {
            category: 'SPARE_PARTS',
            sl: 2,
            description: 'Pneumatic Multi-Function Foot Pedal Microswitch',
            qty: 1,
            unitPrice: 3500,
            totalPrice: 3500,
            remarks: 'Replaced',
          },
          {
            category: 'SERVICE_LABOUR',
            sl: 1,
            description: 'Hydraulic Pump Flushing, Oil Refill & Re-alignment',
            qty: 1,
            unitPrice: 4000,
            totalPrice: 4000,
            remarks: 'Labour Service',
          },
        ],
      },
    },
  });

  console.log('✅ Seeded 3 realistic Requisitions (Repair Cost Estimates).');
};

if (require.main === module) {
  seedSampleRequisitions()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

