import { prisma } from '../config/prisma';

export const seedSampleGatePasses = async (): Promise<void> => {
  console.log('🌱 Reseeding authentic Gate Passes (মেশিন গ্রহণ ও ফেরত চালান)...');

  // Clear older gate passes to populate complete bilingual fields
  await prisma.gatePassItem.deleteMany({});
  await prisma.gatePass.deleteMany({});

  // 1. Corporate: Popular Diagnostic Center Ltd. — মেশিন গ্রহণ চালান (RECEIVING)
  await prisma.gatePass.create({
    data: {
      passNo: 'OSRT/GP/2026-0001',
      date: new Date('2026-06-18'),
      customerType: 'CORPORATE',
      passType: 'RETURNABLE',
      challanKind: 'RECEIVING',
      referenceWorkOrderNo: 'WO-PDC-2026-8819',
      gatePassCategory: 'মেরামতের জন্য মেশিন গ্রহণ',

      organizationName: 'Popular Diagnostic Center Ltd. (Shantinagar)',
      departmentWard: 'Biochemistry & Pathology Lab',
      address: 'Plot 02, Road 05, Shantinagar, Dhaka-1217',
      contactPerson: 'Dr. Anwarul Haque (Lab Director)',
      contactNo: '01715-998811',

      machineName: 'Fully Automated Chemistry Analyzer',
      quantity: 1,
      brandManufacturer: 'Mindray',
      modelNo: 'BS-240',
      serialNo: 'BS-88390-D',
      assetIdNo: 'AST-PDC-0442',
      accessoriesReceived: 'Main Titanium Sample Probe, Power Cord, Communication Cable',
      machineCondition: 'অচল',
      reportedProblem: 'Photometer optical sensor deviation, reagent sample probe clogged & peristaltic pump pressure failure.',
      physicalDamageCondition: 'External body intact, minor surface scratches, optical housing sealed.',

      destination: '1 Service & Repair Technology Workshop, Badda',
      vehicleNo: 'Dhaka Metro-GA 11-4022',
      carrierName: 'Md. Rafiqul Islam (Senior Dispatcher)',
      deliveredBy: 'Md. Kamrul Hasan (Store Officer, Popular Diagnostic)',
      designationStaffId: 'Store Officer (EMP-992)',
      transportPurpose: 'মেরামত',
      purpose: 'Lab equipment workshop overhaul and photometer repair',
      expectedReturnDate: new Date('2026-06-28'),

      status: 'APPROVED',
      preparedBy: '1 Service & Repair Technology.',
      authorizedBy: 'Engr. Sagor Badsha (Chief Engineer)',
      receivedBy: 'Md. Rafiqul Islam (Senior Dispatcher)',
      items: {
        create: [
          {
            sl: 1,
            description: 'Mindray BS-240 Fully Automated Chemistry Analyzer Unit',
            qty: 1,
            serialNo: 'BS-88390-D',
            remarks: 'Clogged sample probe & optical sensor fault',
          },
        ],
      },
    },
  });

  // 2. Corporate: Popular Diagnostic Center Ltd. — মেশিন ফেরত চালান (RETURN)
  await prisma.gatePass.create({
    data: {
      passNo: 'OSRT/GP/2026-0002',
      date: new Date('2026-06-28'),
      customerType: 'CORPORATE',
      passType: 'RETURNABLE',
      challanKind: 'RETURN',
      referenceWorkOrderNo: 'WO-PDC-2026-8819',
      serviceReportNo: 'SR-2026-0041',

      organizationName: 'Popular Diagnostic Center Ltd. (Shantinagar)',
      departmentWard: 'Biochemistry & Pathology Lab',
      address: 'Plot 02, Road 05, Shantinagar, Dhaka-1217',
      contactPerson: 'Dr. Anwarul Haque (Lab Director)',
      contactNo: '01715-998811',

      machineName: 'Fully Automated Chemistry Analyzer (Mindray BS-240)',
      quantity: 1,
      brandManufacturer: 'Mindray',
      modelNo: 'BS-240',
      serialNo: 'BS-88390-D',

      returnDate: new Date('2026-06-28'),
      returnCondition: 'মেরামত ও পরীক্ষা সম্পন্ন',
      workDoneComments: 'Photometer optical sensor calibrated, titanium sample probe replaced, peristaltic tubing overhauled. Full QC testing passed.',
      returnedAccessories: 'Main Unit, Replacement Probe Assembly, Original Power Cord, Calibration Certificate.',
      pendingIssuesAdvice: 'Operate with constant online UPS and 24°C room temperature.',

      destination: 'Popular Diagnostic Center Ltd., Shantinagar',
      vehicleNo: 'Dhaka Metro-GA 11-4022',
      carrierName: 'Md. Rafiqul Islam',
      deliveredBy: 'Md. Rafiqul Islam (1 Service & Repair Tech)',
      transportPurpose: 'ফেরত',

      status: 'COMPLETED',
      preparedBy: '1 Service & Repair Technology.',
      authorizedBy: 'Engr. Sagor Badsha (Chief Engineer)',
      receivedBy: 'Dr. Anwarul Haque',
      items: {
        create: [
          {
            sl: 1,
            description: 'Mindray BS-240 Chemistry Analyzer (Repaired & Tested)',
            qty: 1,
            serialNo: 'BS-88390-D',
            remarks: 'QC Passed - 1 Year Panel Service Warranty',
          },
        ],
      },
    },
  });

  // 3. Non-Corporate: Dr. Mahbubur Rahman Clinic — মেশিন গ্রহণ চালান (RECEIVING)
  await prisma.gatePass.create({
    data: {
      passNo: 'OSRT/GP/2026-0003',
      date: new Date('2026-06-25'),
      customerType: 'NON_CORPORATE',
      passType: 'RETURNABLE',
      challanKind: 'RECEIVING',
      referenceWorkOrderNo: 'CLI-MR-2026',
      gatePassCategory: 'মেরামতের জন্য মেশিন গ্রহণ',

      organizationName: 'Dr. Mahbubur Rahman Dental & Orthopedic Chamber',
      departmentWard: 'OPD Chamber 4',
      address: 'House 14, Road 5, Dhanmondi, Dhaka',
      contactPerson: 'Dr. Mahbubur Rahman',
      contactNo: '01912-887766',

      machineName: 'Woodpecker Ultrasonic Dental Scaler',
      quantity: 1,
      brandManufacturer: 'Woodpecker Guilin',
      modelNo: 'UDS-J',
      serialNo: 'WDP-UDS-88210',
      assetIdNo: 'DENT-08',
      accessoriesReceived: 'Handpiece, Footswitch, Water Pipe, Power Adapter',
      machineCondition: 'অচল',
      reportedProblem: 'No ultrasonic vibration output, transducer overheating error.',
      physicalDamageCondition: 'Handpiece cable connector loose, transducer housing normal.',

      destination: '1 Service & Repair Technology Workshop, Badda',
      vehicleNo: 'Courier / Motorbike (Reg: Dhaka Metro-HA 33-1289)',
      carrierName: 'Abdul Karim',
      deliveredBy: 'Abdul Karim (Chamber Assistant)',
      transportPurpose: 'মেরামত',
      purpose: 'Transducer coil rewinding and circuit diagnosis',
      expectedReturnDate: new Date('2026-07-02'),

      status: 'APPROVED',
      preparedBy: '1 Service & Repair Technology.',
      authorizedBy: 'Engr. Sagor Badsha (Chief Engineer)',
      receivedBy: 'Engr. Sagor Badsha',
      items: {
        create: [
          {
            sl: 1,
            description: 'Woodpecker UDS-J Ultrasonic Dental Scaler Unit',
            qty: 1,
            serialNo: 'WDP-UDS-88210',
            remarks: 'Defective ultrasonic transducer',
          },
        ],
      },
    },
  });

  // 4. Non-Corporate: Dr. Mahbubur Rahman Clinic — মেশিন ফেরত চালান (RETURN)
  await prisma.gatePass.create({
    data: {
      passNo: 'OSRT/GP/2026-0004',
      date: new Date('2026-07-02'),
      customerType: 'NON_CORPORATE',
      passType: 'RETURNABLE',
      challanKind: 'RETURN',
      referenceWorkOrderNo: 'CLI-MR-2026',
      serviceReportNo: 'SR-2026-0072',

      organizationName: 'Dr. Mahbubur Rahman Dental & Orthopedic Chamber',
      departmentWard: 'OPD Chamber 4',
      address: 'House 14, Road 5, Dhanmondi, Dhaka',
      contactPerson: 'Dr. Mahbubur Rahman',
      contactNo: '01912-887766',

      machineName: 'Woodpecker Ultrasonic Dental Scaler (UDS-J)',
      quantity: 1,
      brandManufacturer: 'Woodpecker Guilin',
      modelNo: 'UDS-J',
      serialNo: 'WDP-UDS-88210',

      returnDate: new Date('2026-07-02'),
      returnCondition: 'মেরামত ও পরীক্ষা সম্পন্ন',
      workDoneComments: 'Piezoelectric transducer re-aligned, cable connector replaced, scaling frequency tuned at 28kHz.',
      returnedAccessories: 'Main Unit, Handpiece, Footswitch, Power Adapter, Water Pipe.',
      pendingIssuesAdvice: 'Avoid pulling handpiece cable abruptly during dental procedures.',

      destination: 'House 14, Road 5, Dhanmondi, Dhaka',
      vehicleNo: 'Dhaka Metro-HA 33-1289',
      carrierName: 'Md. Sumon Ahmed',
      deliveredBy: 'Md. Sumon Ahmed (1 Service & Repair Tech)',
      transportPurpose: 'ফেরত',

      status: 'COMPLETED',
      preparedBy: '1 Service & Repair Technology.',
      authorizedBy: 'Engr. Sagor Badsha (Chief Engineer)',
      receivedBy: 'Dr. Mahbubur Rahman',
      items: {
        create: [
          {
            sl: 1,
            description: 'Woodpecker UDS-J Dental Scaler (Repaired & Delivered)',
            qty: 1,
            serialNo: 'WDP-UDS-88210',
            remarks: '6 Months Service Warranty',
          },
        ],
      },
    },
  });

  console.log('✅ 4 authentic Gate Passes (মেশিন গ্রহণ ও ফেরত চালান) seeded successfully.');
};

if (require.main === module) {
  seedSampleGatePasses()
    .catch((err) => {
      console.error('❌ Error seeding gate passes:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
