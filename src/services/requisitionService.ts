import { prisma } from '../config/prisma';
import { Requisition, RequisitionItem, Prisma } from '@prisma/client';
import { CustomerType, RequisitionStatus, RequisitionItemCategory } from '../types';
import { 
  CreateRequisitionInput, 
  UpdateRequisitionInput, 
  RequisitionFilterQuery, 
  RequisitionListResponse, 
  RequisitionRecord 
} from '../types';
import { AppError } from '../utils/appError';

export const generateNextEstimateNo = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const prefix = `RCE-${currentYear}-`;

  const lastReq = await prisma.requisition.findFirst({
    where: { estimateNo: { startsWith: prefix } },
    orderBy: { estimateNo: 'desc' },
  });

  if (!lastReq) {
    return `${prefix}0001`;
  }

  const match = lastReq.estimateNo.match(/(\d+)$/);
  const nextNum = match ? parseInt(match[1], 10) + 1 : 1;
  return `${prefix}${String(nextNum).padStart(4, '0')}`;
};

const formatRequisition = (
  req: Requisition & { items?: RequisitionItem[] }
): RequisitionRecord => ({
  id: req.id,
  estimateNo: req.estimateNo,
  date: req.date instanceof Date ? req.date.toISOString().split('T')[0] : String(req.date),
  validUpTo: req.validUpTo instanceof Date ? req.validUpTo.toISOString().split('T')[0] : req.validUpTo ? String(req.validUpTo) : null,
  customerType: req.customerType as CustomerType,
  organizationName: req.organizationName,
  departmentWard: req.departmentWard,
  contactPerson: req.contactPerson,
  contactNo: req.contactNo,
  equipmentName: req.equipmentName,
  brand: req.brand,
  model: req.model,
  serialNo: req.serialNo,
  faultDescription: req.faultDescription,
  sparePartsTotal: Number(req.sparePartsTotal),
  serviceLabourTotal: Number(req.serviceLabourTotal),
  subTotal: Number(req.subTotal),
  discount: Number(req.discount),
  grandTotal: Number(req.grandTotal),
  status: req.status as RequisitionStatus,
  preparedBy: req.preparedBy,
  clientApprovalNote: req.clientApprovalNote,
  createdById: req.createdById,
  createdAt: req.createdAt,
  updatedAt: req.updatedAt,
  items: (req.items || []).map((it) => ({
    id: it.id,
    requisitionId: it.requisitionId,
    category: it.category as RequisitionItemCategory,
    sl: it.sl,
    description: it.description,
    qty: Number(it.qty),
    unitPrice: Number(it.unitPrice),
    totalPrice: Number(it.totalPrice),
    remarks: it.remarks,
  })),
});

export const getRequisitions = async (query: RequisitionFilterQuery): Promise<RequisitionListResponse> => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const where: Prisma.RequisitionWhereInput = {};

  if (query.customerType) {
    where.customerType = query.customerType;
  }

  if (query.status && query.status !== 'ALL') {
    where.status = query.status;
  }

  if (query.search && query.search.trim()) {
    const term = query.search.trim();
    where.OR = [
      { estimateNo: { contains: term } },
      { organizationName: { contains: term } },
      { contactPerson: { contains: term } },
      { contactNo: { contains: term } },
      { equipmentName: { contains: term } },
      { brand: { contains: term } },
      { model: { contains: term } },
      { serialNo: { contains: term } },
    ];
  }

  if (query.startDate || query.endDate) {
    where.date = {};
    if (query.startDate) where.date.gte = new Date(query.startDate);
    if (query.endDate) where.date.lte = new Date(query.endDate);
  }

  const orderBy: Prisma.RequisitionOrderByWithRelationInput = {};
  if (query.sortBy) {
    const order = query.sortOrder === 'asc' ? 'asc' : 'desc';
    if (query.sortBy === 'estimateNo') orderBy.estimateNo = order;
    else if (query.sortBy === 'organizationName') orderBy.organizationName = order;
    else if (query.sortBy === 'grandTotal') orderBy.grandTotal = order;
    else if (query.sortBy === 'date') orderBy.date = order;
    else orderBy.date = 'desc';
  } else {
    orderBy.date = 'desc';
  }

  const [items, total, aggregates, pendingCount, approvedCount] = await Promise.all([
    prisma.requisition.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        items: {
          orderBy: [{ category: 'asc' }, { sl: 'asc' }],
        },
      },
    }),
    prisma.requisition.count({ where }),
    prisma.requisition.aggregate({
      where,
      _sum: {
        grandTotal: true,
      },
    }),
    prisma.requisition.count({ where: { ...where, status: 'PENDING' } }),
    prisma.requisition.count({ where: { ...where, status: 'APPROVED' } }),
  ]);

  return {
    items: items.map(formatRequisition),
    total,
    totalGrandAmount: Number(aggregates._sum.grandTotal || 0),
    totalPendingCount: pendingCount,
    totalApprovedCount: approvedCount,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getRequisitionById = async (id: string): Promise<RequisitionRecord> => {
  const req = await prisma.requisition.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: [{ category: 'asc' }, { sl: 'asc' }],
      },
    },
  });

  if (!req) {
    throw new AppError('Requisition not found.', 404);
  }

  return formatRequisition(req);
};

export const createRequisition = async (
  input: CreateRequisitionInput,
  userId?: string
): Promise<RequisitionRecord> => {
  if (!input.organizationName || !input.organizationName.trim()) {
    throw new AppError('Organization name is required.', 400);
  }

  const estimateNo = input.estimateNo?.trim() || (await generateNextEstimateNo());

  const existing = await prisma.requisition.findUnique({
    where: { estimateNo },
  });
  if (existing) {
    throw new AppError(`Estimate number ${estimateNo} already exists.`, 400);
  }

  const rawItems = input.items && input.items.length > 0 ? input.items : [];
  let sparePartsTotal = 0;
  let serviceLabourTotal = 0;

  const itemsData = rawItems.map((item, idx) => {
    const qty = Number(item.qty) || 1;
    const unitPrice = Number(item.unitPrice) || 0;
    const totalPrice = item.totalPrice !== undefined ? Number(item.totalPrice) : qty * unitPrice;

    if (item.category === 'SERVICE_LABOUR') {
      serviceLabourTotal += totalPrice;
    } else {
      sparePartsTotal += totalPrice;
    }

    return {
      category: item.category || ('SPARE_PARTS' as RequisitionItemCategory),
      sl: item.sl || idx + 1,
      description: item.description?.trim() || `Item ${idx + 1}`,
      qty,
      unitPrice,
      totalPrice,
      remarks: item.remarks?.trim() || null,
    };
  });

  const subTotal = sparePartsTotal + serviceLabourTotal;
  const discount = Number(input.discount) || 0;
  const grandTotal = Math.max(0, subTotal - discount);

  const created = await prisma.requisition.create({
    data: {
      estimateNo,
      date: new Date(input.date || Date.now()),
      validUpTo: input.validUpTo ? new Date(input.validUpTo) : null,
      customerType: input.customerType || 'CORPORATE',
      organizationName: input.organizationName.trim(),
      departmentWard: input.departmentWard?.trim() || null,
      contactPerson: input.contactPerson?.trim() || null,
      contactNo: input.contactNo?.trim() || null,
      equipmentName: input.equipmentName?.trim() || null,
      brand: input.brand?.trim() || null,
      model: input.model?.trim() || null,
      serialNo: input.serialNo?.trim() || null,
      faultDescription: input.faultDescription?.trim() || null,
      sparePartsTotal,
      serviceLabourTotal,
      subTotal,
      discount,
      grandTotal,
      status: input.status || 'PENDING',
      preparedBy: input.preparedBy?.trim() || '1 Service & Repair Technology.',
      clientApprovalNote: input.clientApprovalNote?.trim() || null,
      createdById: userId || null,
      items: {
        create: itemsData,
      },
    },
    include: {
      items: {
        orderBy: [{ category: 'asc' }, { sl: 'asc' }],
      },
    },
  });

  return formatRequisition(created);
};

export const updateRequisition = async (
  id: string,
  input: UpdateRequisitionInput
): Promise<RequisitionRecord> => {
  const existing = await prisma.requisition.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!existing) {
    throw new AppError('Requisition not found.', 404);
  }

  if (input.estimateNo && input.estimateNo !== existing.estimateNo) {
    const duplicate = await prisma.requisition.findUnique({
      where: { estimateNo: input.estimateNo },
    });
    if (duplicate) {
      throw new AppError(`Estimate number ${input.estimateNo} already exists.`, 400);
    }
  }

  let sparePartsTotal = Number(existing.sparePartsTotal);
  let serviceLabourTotal = Number(existing.serviceLabourTotal);
  let itemsCreateOrReplace = false;
  let newItemsData: { category: RequisitionItemCategory; sl: number; description: string; qty: number; unitPrice: number; totalPrice: number; remarks: string | null }[] = [];

  if (input.items && Array.isArray(input.items)) {
    itemsCreateOrReplace = true;
    sparePartsTotal = 0;
    serviceLabourTotal = 0;
    newItemsData = input.items.map((item, idx) => {
      const qty = Number(item.qty) || 1;
      const unitPrice = Number(item.unitPrice) || 0;
      const totalPrice = item.totalPrice !== undefined ? Number(item.totalPrice) : qty * unitPrice;

      if (item.category === 'SERVICE_LABOUR') {
        serviceLabourTotal += totalPrice;
      } else {
        sparePartsTotal += totalPrice;
      }

      return {
        category: item.category || ('SPARE_PARTS' as RequisitionItemCategory),
        sl: item.sl || idx + 1,
        description: item.description?.trim() || `Item ${idx + 1}`,
        qty,
        unitPrice,
        totalPrice,
        remarks: item.remarks?.trim() || null,
      };
    });
  }

  const subTotal = sparePartsTotal + serviceLabourTotal;
  const discount = input.discount !== undefined ? Number(input.discount) : Number(existing.discount);
  const grandTotal = Math.max(0, subTotal - discount);

  const updated = await prisma.$transaction(async (tx) => {
    if (itemsCreateOrReplace) {
      await tx.requisitionItem.deleteMany({
        where: { requisitionId: id },
      });
      await tx.requisitionItem.createMany({
        data: newItemsData.map((d) => ({ ...d, requisitionId: id })),
      });
    }

    return tx.requisition.update({
      where: { id },
      data: {
        estimateNo: input.estimateNo?.trim() || existing.estimateNo,
        date: input.date ? new Date(input.date) : existing.date,
        validUpTo: input.validUpTo !== undefined ? (input.validUpTo ? new Date(input.validUpTo) : null) : existing.validUpTo,
        customerType: input.customerType || existing.customerType,
        organizationName: input.organizationName?.trim() || existing.organizationName,
        departmentWard: input.departmentWard !== undefined ? input.departmentWard?.trim() || null : existing.departmentWard,
        contactPerson: input.contactPerson !== undefined ? input.contactPerson?.trim() || null : existing.contactPerson,
        contactNo: input.contactNo !== undefined ? input.contactNo?.trim() || null : existing.contactNo,
        equipmentName: input.equipmentName !== undefined ? input.equipmentName?.trim() || null : existing.equipmentName,
        brand: input.brand !== undefined ? input.brand?.trim() || null : existing.brand,
        model: input.model !== undefined ? input.model?.trim() || null : existing.model,
        serialNo: input.serialNo !== undefined ? input.serialNo?.trim() || null : existing.serialNo,
        faultDescription: input.faultDescription !== undefined ? input.faultDescription?.trim() || null : existing.faultDescription,
        sparePartsTotal,
        serviceLabourTotal,
        subTotal,
        discount,
        grandTotal,
        status: input.status || existing.status,
        preparedBy: input.preparedBy !== undefined ? input.preparedBy?.trim() || null : existing.preparedBy,
        clientApprovalNote: input.clientApprovalNote !== undefined ? input.clientApprovalNote?.trim() || null : existing.clientApprovalNote,
      },
      include: {
        items: {
          orderBy: [{ category: 'asc' }, { sl: 'asc' }],
        },
      },
    });
  });

  return formatRequisition(updated);
};

export const deleteRequisition = async (id: string): Promise<void> => {
  const existing = await prisma.requisition.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Requisition not found.', 404);
  }
  await prisma.requisition.delete({ where: { id } });
};

export const bulkDeleteRequisitions = async (ids: string[]): Promise<number> => {
  if (!ids || ids.length === 0) {
    throw new AppError('No requisition IDs provided for deletion.', 400);
  }
  const result = await prisma.requisition.deleteMany({
    where: { id: { in: ids } },
  });
  return result.count;
};

export const exportRequisitionsCsv = async (query: RequisitionFilterQuery): Promise<string> => {
  const where: Prisma.RequisitionWhereInput = {};
  if (query.customerType) where.customerType = query.customerType;
  if (query.status && query.status !== 'ALL') where.status = query.status;
  if (query.startDate || query.endDate) {
    where.date = {};
    if (query.startDate) where.date.gte = new Date(query.startDate);
    if (query.endDate) where.date.lte = new Date(query.endDate);
  }

  const items = await prisma.requisition.findMany({
    where,
    orderBy: { date: 'desc' },
    include: { items: true },
  });

  const header = [
    'Estimate No',
    'Date',
    'Valid Up To',
    'Customer Type',
    'Organization Name',
    'Department/Ward',
    'Contact Person',
    'Contact No',
    'Equipment Name',
    'Brand',
    'Model',
    'Serial No',
    'Spare Parts Total',
    'Service & Labour Total',
    'Sub Total',
    'Discount',
    'Grand Total',
    'Status',
  ];

  const escapeCsv = (val: unknown): string => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = items.map((r) => [
    escapeCsv(r.estimateNo),
    escapeCsv(r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date),
    escapeCsv(r.validUpTo instanceof Date ? r.validUpTo.toISOString().split('T')[0] : ''),
    escapeCsv(r.customerType),
    escapeCsv(r.organizationName),
    escapeCsv(r.departmentWard || ''),
    escapeCsv(r.contactPerson || ''),
    escapeCsv(r.contactNo || ''),
    escapeCsv(r.equipmentName || ''),
    escapeCsv(r.brand || ''),
    escapeCsv(r.model || ''),
    escapeCsv(r.serialNo || ''),
    escapeCsv(Number(r.sparePartsTotal)),
    escapeCsv(Number(r.serviceLabourTotal)),
    escapeCsv(Number(r.subTotal)),
    escapeCsv(Number(r.discount)),
    escapeCsv(Number(r.grandTotal)),
    escapeCsv(r.status),
  ]);

  return [header.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
};

