import { prisma } from '../config/prisma';
import { GatePass, GatePassItem, Prisma } from '@prisma/client';
import { CustomerType, GatePassType, GatePassStatus, ChallanKind } from '../types';
import { 
  CreateGatePassInput, 
  UpdateGatePassInput, 
  GatePassFilterQuery, 
  GatePassListResponse, 
  GatePassRecord 
} from '../types';
import { AppError } from '../utils/appError';

export const generateNextGatePassNo = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const prefix = `OSRT/GP/${currentYear}-`;

  const lastPass = await prisma.gatePass.findFirst({
    where: { passNo: { startsWith: prefix } },
    orderBy: { passNo: 'desc' },
  });

  if (!lastPass) {
    return `${prefix}0001`;
  }

  const match = lastPass.passNo.match(/(\d+)$/);
  const nextNum = match ? parseInt(match[1], 10) + 1 : 1;
  return `${prefix}${String(nextNum).padStart(4, '0')}`;
};

const formatGatePass = (
  gp: GatePass & { items?: GatePassItem[] }
): GatePassRecord => ({
  id: gp.id,
  passNo: gp.passNo,
  date: gp.date instanceof Date ? gp.date.toISOString().split('T')[0] : String(gp.date),
  customerType: gp.customerType as CustomerType,
  passType: gp.passType as GatePassType,
  challanKind: gp.challanKind as ChallanKind,

  referenceWorkOrderNo: gp.referenceWorkOrderNo,
  gatePassCategory: gp.gatePassCategory,

  organizationName: gp.organizationName,
  departmentWard: gp.departmentWard,
  address: gp.address,
  contactPerson: gp.contactPerson,
  contactNo: gp.contactNo,

  machineName: gp.machineName,
  quantity: gp.quantity,
  brandManufacturer: gp.brandManufacturer,
  modelNo: gp.modelNo,
  serialNo: gp.serialNo,
  assetIdNo: gp.assetIdNo,
  accessoriesReceived: gp.accessoriesReceived,
  machineCondition: gp.machineCondition,
  reportedProblem: gp.reportedProblem,
  physicalDamageCondition: gp.physicalDamageCondition,

  destination: gp.destination,
  vehicleNo: gp.vehicleNo,
  carrierName: gp.carrierName,
  deliveredBy: gp.deliveredBy,
  designationStaffId: gp.designationStaffId,
  transportPurpose: gp.transportPurpose,
  purpose: gp.purpose,
  expectedReturnDate: gp.expectedReturnDate instanceof Date ? gp.expectedReturnDate.toISOString().split('T')[0] : gp.expectedReturnDate ? String(gp.expectedReturnDate) : null,

  returnDate: gp.returnDate instanceof Date ? gp.returnDate.toISOString().split('T')[0] : gp.returnDate ? String(gp.returnDate) : null,
  serviceReportNo: gp.serviceReportNo,
  returnCondition: gp.returnCondition,
  workDoneComments: gp.workDoneComments,
  returnedAccessories: gp.returnedAccessories,
  pendingIssuesAdvice: gp.pendingIssuesAdvice,

  status: gp.status as GatePassStatus,
  preparedBy: gp.preparedBy,
  authorizedBy: gp.authorizedBy,
  receivedBy: gp.receivedBy,
  createdById: gp.createdById,
  createdAt: gp.createdAt,
  updatedAt: gp.updatedAt,
  items: (gp.items || []).map((it) => ({
    id: it.id,
    gatePassId: it.gatePassId,
    sl: it.sl,
    description: it.description,
    qty: Number(it.qty),
    serialNo: it.serialNo,
    remarks: it.remarks,
  })),
});

export const getGatePasses = async (query: GatePassFilterQuery): Promise<GatePassListResponse> => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const where: Prisma.GatePassWhereInput = {};

  if (query.customerType) {
    where.customerType = query.customerType;
  }

  if (query.passType && query.passType !== 'ALL') {
    where.passType = query.passType;
  }

  if (query.challanKind && query.challanKind !== 'ALL') {
    where.challanKind = query.challanKind;
  }

  if (query.status && query.status !== 'ALL') {
    where.status = query.status;
  }

  if (query.search && query.search.trim()) {
    const term = query.search.trim();
    where.OR = [
      { passNo: { contains: term } },
      { organizationName: { contains: term } },
      { machineName: { contains: term } },
      { serialNo: { contains: term } },
      { contactPerson: { contains: term } },
      { destination: { contains: term } },
      { vehicleNo: { contains: term } },
      { carrierName: { contains: term } },
      { serviceReportNo: { contains: term } },
    ];
  }

  if (query.startDate || query.endDate) {
    where.date = {};
    if (query.startDate) where.date.gte = new Date(query.startDate);
    if (query.endDate) where.date.lte = new Date(query.endDate);
  }

  const orderBy: Prisma.GatePassOrderByWithRelationInput = {};
  if (query.sortBy) {
    const order = query.sortOrder === 'asc' ? 'asc' : 'desc';
    if (query.sortBy === 'passNo') orderBy.passNo = order;
    else if (query.sortBy === 'organizationName') orderBy.organizationName = order;
    else if (query.sortBy === 'date') orderBy.date = order;
    else orderBy.date = 'desc';
  } else {
    orderBy.date = 'desc';
  }

  const [items, total, receivingCount, returnCount, pendingCount, dispatchedCount, completedCount] = await Promise.all([
    prisma.gatePass.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        items: {
          orderBy: { sl: 'asc' },
        },
      },
    }),
    prisma.gatePass.count({ where }),
    prisma.gatePass.count({ where: { ...where, challanKind: 'RECEIVING' } }),
    prisma.gatePass.count({ where: { ...where, challanKind: 'RETURN' } }),
    prisma.gatePass.count({ where: { ...where, status: 'PENDING' } }),
    prisma.gatePass.count({ where: { ...where, status: 'DISPATCHED' } }),
    prisma.gatePass.count({ where: { ...where, status: 'COMPLETED' } }),
  ]);

  return {
    items: items.map(formatGatePass),
    total,
    totalReceivingCount: receivingCount,
    totalReturnCount: returnCount,
    totalPendingCount: pendingCount,
    totalDispatchedCount: dispatchedCount,
    totalCompletedCount: completedCount,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getGatePassById = async (id: string): Promise<GatePassRecord> => {
  const gp = await prisma.gatePass.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { sl: 'asc' },
      },
    },
  });

  if (!gp) {
    throw new AppError('Gate pass not found.', 404);
  }

  return formatGatePass(gp);
};

export const createGatePass = async (
  input: CreateGatePassInput,
  userId?: string
): Promise<GatePassRecord> => {
  if (!input.organizationName || !input.organizationName.trim()) {
    throw new AppError('Organization name is required.', 400);
  }

  const passNo = input.passNo?.trim() || (await generateNextGatePassNo());

  const existing = await prisma.gatePass.findUnique({
    where: { passNo },
  });
  if (existing) {
    throw new AppError(`Gate pass number ${passNo} already exists.`, 400);
  }

  const rawItems = input.items && input.items.length > 0 ? input.items : [];
  const itemsData = rawItems.map((item, idx) => ({
    sl: item.sl || idx + 1,
    description: item.description?.trim() || `Item ${idx + 1}`,
    qty: Number(item.qty) || 1,
    serialNo: item.serialNo?.trim() || null,
    remarks: item.remarks?.trim() || null,
  }));

  const created = await prisma.gatePass.create({
    data: {
      passNo,
      date: new Date(input.date || Date.now()),
      customerType: input.customerType || 'CORPORATE',
      passType: input.passType || 'RETURNABLE',
      challanKind: (input.challanKind as ChallanKind) || 'RECEIVING',

      referenceWorkOrderNo: input.referenceWorkOrderNo?.trim() || null,
      gatePassCategory: input.gatePassCategory?.trim() || null,

      organizationName: input.organizationName.trim(),
      departmentWard: input.departmentWard?.trim() || null,
      address: input.address?.trim() || null,
      contactPerson: input.contactPerson?.trim() || null,
      contactNo: input.contactNo?.trim() || null,

      machineName: input.machineName?.trim() || null,
      quantity: Number(input.quantity) || 1,
      brandManufacturer: input.brandManufacturer?.trim() || null,
      modelNo: input.modelNo?.trim() || null,
      serialNo: input.serialNo?.trim() || null,
      assetIdNo: input.assetIdNo?.trim() || null,
      accessoriesReceived: input.accessoriesReceived?.trim() || null,
      machineCondition: input.machineCondition?.trim() || null,
      reportedProblem: input.reportedProblem?.trim() || null,
      physicalDamageCondition: input.physicalDamageCondition?.trim() || null,

      destination: input.destination?.trim() || null,
      vehicleNo: input.vehicleNo?.trim() || null,
      carrierName: input.carrierName?.trim() || null,
      deliveredBy: input.deliveredBy?.trim() || null,
      designationStaffId: input.designationStaffId?.trim() || null,
      transportPurpose: input.transportPurpose?.trim() || null,
      purpose: input.purpose?.trim() || null,
      expectedReturnDate: input.expectedReturnDate ? new Date(input.expectedReturnDate) : null,

      returnDate: input.returnDate ? new Date(input.returnDate) : null,
      serviceReportNo: input.serviceReportNo?.trim() || null,
      returnCondition: input.returnCondition?.trim() || null,
      workDoneComments: input.workDoneComments?.trim() || null,
      returnedAccessories: input.returnedAccessories?.trim() || null,
      pendingIssuesAdvice: input.pendingIssuesAdvice?.trim() || null,

      status: input.status || 'PENDING',
      preparedBy: input.preparedBy?.trim() || '1 Service & Repair Technology.',
      authorizedBy: input.authorizedBy?.trim() || null,
      receivedBy: input.receivedBy?.trim() || null,
      createdById: userId || null,
      items: {
        create: itemsData,
      },
    },
    include: {
      items: {
        orderBy: { sl: 'asc' },
      },
    },
  });

  return formatGatePass(created);
};

export const updateGatePass = async (
  id: string,
  input: UpdateGatePassInput
): Promise<GatePassRecord> => {
  const existing = await prisma.gatePass.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!existing) {
    throw new AppError('Gate pass not found.', 404);
  }

  if (input.passNo && input.passNo !== existing.passNo) {
    const duplicate = await prisma.gatePass.findUnique({
      where: { passNo: input.passNo },
    });
    if (duplicate) {
      throw new AppError(`Gate pass number ${input.passNo} already exists.`, 400);
    }
  }

  let itemsCreateOrReplace = false;
  let newItemsData: { sl: number; description: string; qty: number; serialNo: string | null; remarks: string | null }[] = [];

  if (input.items && Array.isArray(input.items)) {
    itemsCreateOrReplace = true;
    newItemsData = input.items.map((item, idx) => ({
      sl: item.sl || idx + 1,
      description: item.description?.trim() || `Item ${idx + 1}`,
      qty: Number(item.qty) || 1,
      serialNo: item.serialNo?.trim() || null,
      remarks: item.remarks?.trim() || null,
    }));
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (itemsCreateOrReplace) {
      await tx.gatePassItem.deleteMany({
        where: { gatePassId: id },
      });
      await tx.gatePassItem.createMany({
        data: newItemsData.map((d) => ({ ...d, gatePassId: id })),
      });
    }

    return tx.gatePass.update({
      where: { id },
      data: {
        passNo: input.passNo?.trim() || existing.passNo,
        date: input.date ? new Date(input.date) : existing.date,
        customerType: input.customerType || existing.customerType,
        passType: input.passType || existing.passType,
        challanKind: (input.challanKind as ChallanKind) || existing.challanKind,

        referenceWorkOrderNo: input.referenceWorkOrderNo !== undefined ? input.referenceWorkOrderNo?.trim() || null : existing.referenceWorkOrderNo,
        gatePassCategory: input.gatePassCategory !== undefined ? input.gatePassCategory?.trim() || null : existing.gatePassCategory,

        organizationName: input.organizationName?.trim() || existing.organizationName,
        departmentWard: input.departmentWard !== undefined ? input.departmentWard?.trim() || null : existing.departmentWard,
        address: input.address !== undefined ? input.address?.trim() || null : existing.address,
        contactPerson: input.contactPerson !== undefined ? input.contactPerson?.trim() || null : existing.contactPerson,
        contactNo: input.contactNo !== undefined ? input.contactNo?.trim() || null : existing.contactNo,

        machineName: input.machineName !== undefined ? input.machineName?.trim() || null : existing.machineName,
        quantity: input.quantity !== undefined ? Number(input.quantity) || 1 : existing.quantity,
        brandManufacturer: input.brandManufacturer !== undefined ? input.brandManufacturer?.trim() || null : existing.brandManufacturer,
        modelNo: input.modelNo !== undefined ? input.modelNo?.trim() || null : existing.modelNo,
        serialNo: input.serialNo !== undefined ? input.serialNo?.trim() || null : existing.serialNo,
        assetIdNo: input.assetIdNo !== undefined ? input.assetIdNo?.trim() || null : existing.assetIdNo,
        accessoriesReceived: input.accessoriesReceived !== undefined ? input.accessoriesReceived?.trim() || null : existing.accessoriesReceived,
        machineCondition: input.machineCondition !== undefined ? input.machineCondition?.trim() || null : existing.machineCondition,
        reportedProblem: input.reportedProblem !== undefined ? input.reportedProblem?.trim() || null : existing.reportedProblem,
        physicalDamageCondition: input.physicalDamageCondition !== undefined ? input.physicalDamageCondition?.trim() || null : existing.physicalDamageCondition,

        destination: input.destination !== undefined ? input.destination?.trim() || null : existing.destination,
        vehicleNo: input.vehicleNo !== undefined ? input.vehicleNo?.trim() || null : existing.vehicleNo,
        carrierName: input.carrierName !== undefined ? input.carrierName?.trim() || null : existing.carrierName,
        deliveredBy: input.deliveredBy !== undefined ? input.deliveredBy?.trim() || null : existing.deliveredBy,
        designationStaffId: input.designationStaffId !== undefined ? input.designationStaffId?.trim() || null : existing.designationStaffId,
        transportPurpose: input.transportPurpose !== undefined ? input.transportPurpose?.trim() || null : existing.transportPurpose,
        purpose: input.purpose !== undefined ? input.purpose?.trim() || null : existing.purpose,
        expectedReturnDate: input.expectedReturnDate !== undefined ? (input.expectedReturnDate ? new Date(input.expectedReturnDate) : null) : existing.expectedReturnDate,

        returnDate: input.returnDate !== undefined ? (input.returnDate ? new Date(input.returnDate) : null) : existing.returnDate,
        serviceReportNo: input.serviceReportNo !== undefined ? input.serviceReportNo?.trim() || null : existing.serviceReportNo,
        returnCondition: input.returnCondition !== undefined ? input.returnCondition?.trim() || null : existing.returnCondition,
        workDoneComments: input.workDoneComments !== undefined ? input.workDoneComments?.trim() || null : existing.workDoneComments,
        returnedAccessories: input.returnedAccessories !== undefined ? input.returnedAccessories?.trim() || null : existing.returnedAccessories,
        pendingIssuesAdvice: input.pendingIssuesAdvice !== undefined ? input.pendingIssuesAdvice?.trim() || null : existing.pendingIssuesAdvice,

        status: input.status || existing.status,
        preparedBy: input.preparedBy !== undefined ? input.preparedBy?.trim() || null : existing.preparedBy,
        authorizedBy: input.authorizedBy !== undefined ? input.authorizedBy?.trim() || null : existing.authorizedBy,
        receivedBy: input.receivedBy !== undefined ? input.receivedBy?.trim() || null : existing.receivedBy,
      },
      include: {
        items: {
          orderBy: { sl: 'asc' },
        },
      },
    });
  });

  return formatGatePass(updated);
};

export const deleteGatePass = async (id: string): Promise<void> => {
  const existing = await prisma.gatePass.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Gate pass not found.', 404);
  }

  await prisma.gatePass.delete({ where: { id } });
};

export const bulkDeleteGatePasses = async (ids: string[]): Promise<number> => {
  if (!ids || ids.length === 0) {
    throw new AppError('No gate pass IDs provided for deletion.', 400);
  }

  const result = await prisma.gatePass.deleteMany({
    where: { id: { in: ids } },
  });

  return result.count;
};

export const exportGatePassesCsv = async (query: GatePassFilterQuery): Promise<string> => {
  const where: Prisma.GatePassWhereInput = {};

  if (query.customerType) where.customerType = query.customerType;
  if (query.passType && query.passType !== 'ALL') where.passType = query.passType;
  if (query.challanKind && query.challanKind !== 'ALL') where.challanKind = query.challanKind;
  if (query.status && query.status !== 'ALL') where.status = query.status;
  if (query.startDate || query.endDate) {
    where.date = {};
    if (query.startDate) where.date.gte = new Date(query.startDate);
    if (query.endDate) where.date.lte = new Date(query.endDate);
  }

  const passes = await prisma.gatePass.findMany({
    where,
    orderBy: { date: 'desc' },
    include: { items: true },
  });

  const headers = [
    'Gate Pass No',
    'Date',
    'Challan Type',
    'Customer Type',
    'Pass Type',
    'Organization',
    'Machine Name',
    'Serial No',
    'Contact Person',
    'Contact No',
    'Destination',
    'Vehicle No',
    'Carrier Name',
    'Status',
  ];

  const rows = passes.map((gp) => [
    `"${gp.passNo}"`,
    `"${gp.date instanceof Date ? gp.date.toISOString().split('T')[0] : gp.date}"`,
    `"${gp.challanKind === 'RECEIVING' ? 'মেশিন গ্রহণ চালান' : 'মেশিন ফেরত চালান'}"`,
    `"${gp.customerType}"`,
    `"${gp.passType}"`,
    `"${(gp.organizationName || '').replace(/"/g, '""')}"`,
    `"${(gp.machineName || '').replace(/"/g, '""')}"`,
    `"${(gp.serialNo || '').replace(/"/g, '""')}"`,
    `"${(gp.contactPerson || '').replace(/"/g, '""')}"`,
    `"${(gp.contactNo || '').replace(/"/g, '""')}"`,
    `"${(gp.destination || '').replace(/"/g, '""')}"`,
    `"${(gp.vehicleNo || '').replace(/"/g, '""')}"`,
    `"${(gp.carrierName || '').replace(/"/g, '""')}"`,
    `"${gp.status}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
};
