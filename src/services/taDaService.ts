import { prisma } from '../config/prisma';
import { TaDaBill, TaDaItem, Prisma, TaDaStatus } from '@prisma/client';
import { 
  CreateTaDaBillInput, 
  UpdateTaDaBillInput, 
  TaDaFilterQuery, 
  TaDaListResponse, 
  TaDaBillRecord 
} from '../types';
import { AppError } from '../utils/appError';

export const generateNextTaDaBillNo = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const prefix = `TADA-${currentYear}-`;

  const lastBill = await prisma.taDaBill.findFirst({
    where: { billNo: { startsWith: prefix } },
    orderBy: { billNo: 'desc' },
  });

  if (!lastBill) {
    return `${prefix}0001`;
  }

  const match = lastBill.billNo.match(/(\d+)$/);
  const nextNum = match ? parseInt(match[1], 10) + 1 : 1;
  return `${prefix}${String(nextNum).padStart(4, '0')}`;
};

const formatTaDaBill = (
  bill: TaDaBill & { items?: TaDaItem[] }
): TaDaBillRecord => ({
  id: bill.id,
  billNo: bill.billNo,
  submissionDate: bill.submissionDate instanceof Date ? bill.submissionDate.toISOString().split('T')[0] : String(bill.submissionDate),
  employeeName: bill.employeeName,
  designation: bill.designation,
  employeeId: bill.employeeId,
  department: bill.department,
  totalAmount: Number(bill.totalAmount),
  status: bill.status as TaDaStatus,
  receivedBy: bill.receivedBy,
  checkedBy: bill.checkedBy,
  approvedBy: bill.approvedBy,
  remarks: bill.remarks,
  createdById: bill.createdById,
  createdAt: bill.createdAt,
  updatedAt: bill.updatedAt,
  items: (bill.items || []).map((it) => ({
    id: it.id,
    taDaBillId: it.taDaBillId,
    sl: it.sl,
    date: it.date instanceof Date ? it.date.toISOString().split('T')[0] : it.date ? String(it.date) : null,
    particular: it.particular,
    vehicleName: it.vehicleName,
    qty: Number(it.qty),
    unitTaka: Number(it.unitTaka),
    totalTaka: Number(it.totalTaka),
    checkedBy: it.checkedBy,
  })),
});

export const getTaDaBills = async (query: TaDaFilterQuery): Promise<TaDaListResponse> => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const where: Prisma.TaDaBillWhereInput = {};

  if (query.status && query.status !== 'ALL') {
    where.status = query.status;
  }

  if (query.search && query.search.trim()) {
    const term = query.search.trim();
    where.OR = [
      { billNo: { contains: term } },
      { employeeName: { contains: term } },
      { designation: { contains: term } },
      { employeeId: { contains: term } },
      { department: { contains: term } },
    ];
  }

  if (query.startDate || query.endDate) {
    where.submissionDate = {};
    if (query.startDate) where.submissionDate.gte = new Date(query.startDate);
    if (query.endDate) where.submissionDate.lte = new Date(query.endDate);
  }

  const orderBy: Prisma.TaDaBillOrderByWithRelationInput = {};
  if (query.sortBy) {
    const order = query.sortOrder === 'asc' ? 'asc' : 'desc';
    if (query.sortBy === 'billNo') orderBy.billNo = order;
    else if (query.sortBy === 'employeeName') orderBy.employeeName = order;
    else if (query.sortBy === 'totalAmount') orderBy.totalAmount = order;
    else if (query.sortBy === 'submissionDate') orderBy.submissionDate = order;
    else orderBy.submissionDate = 'desc';
  } else {
    orderBy.submissionDate = 'desc';
  }

  const [items, total, aggregate, pendingCount, approvedCount, paidCount] = await Promise.all([
    prisma.taDaBill.findMany({
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
    prisma.taDaBill.count({ where }),
    prisma.taDaBill.aggregate({
      where,
      _sum: { totalAmount: true },
    }),
    prisma.taDaBill.count({ where: { ...where, status: 'PENDING' } }),
    prisma.taDaBill.count({ where: { ...where, status: 'APPROVED' } }),
    prisma.taDaBill.count({ where: { ...where, status: 'PAID' } }),
  ]);

  return {
    items: items.map(formatTaDaBill),
    total,
    totalAmount: Number(aggregate._sum.totalAmount || 0),
    totalPendingCount: pendingCount,
    totalApprovedCount: approvedCount,
    totalPaidCount: paidCount,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getTaDaBillById = async (id: string): Promise<TaDaBillRecord> => {
  const bill = await prisma.taDaBill.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { sl: 'asc' },
      },
    },
  });

  if (!bill) {
    throw new AppError('TA/DA bill not found.', 404);
  }

  return formatTaDaBill(bill);
};

export const createTaDaBill = async (
  input: CreateTaDaBillInput,
  userId?: string
): Promise<TaDaBillRecord> => {
  if (!input.employeeName || !input.employeeName.trim()) {
    throw new AppError('Employee name is required.', 400);
  }

  const billNo = input.billNo?.trim() || (await generateNextTaDaBillNo());

  const existing = await prisma.taDaBill.findUnique({
    where: { billNo },
  });
  if (existing) {
    throw new AppError(`TA/DA bill number ${billNo} already exists.`, 400);
  }

  const rawItems = input.items && input.items.length > 0 ? input.items : [];
  let calculatedTotal = 0;

  const itemsData = rawItems.map((item, idx) => {
    const qty = Number(item.qty) || 1;
    const unitTaka = Number(item.unitTaka) || 0;
    const totalTaka = item.totalTaka !== undefined ? Number(item.totalTaka) : qty * unitTaka;
    calculatedTotal += totalTaka;

    return {
      sl: item.sl || idx + 1,
      date: item.date ? new Date(item.date) : null,
      particular: item.particular?.trim() || `Travel / Expense ${idx + 1}`,
      vehicleName: item.vehicleName?.trim() || null,
      qty,
      unitTaka,
      totalTaka,
      checkedBy: item.checkedBy?.trim() || null,
    };
  });

  const created = await prisma.taDaBill.create({
    data: {
      billNo,
      submissionDate: new Date(input.submissionDate || Date.now()),
      employeeName: input.employeeName.trim(),
      designation: input.designation?.trim() || null,
      employeeId: input.employeeId?.trim() || null,
      department: input.department?.trim() || null,
      totalAmount: calculatedTotal,
      status: input.status || 'PENDING',
      receivedBy: input.receivedBy?.trim() || null,
      checkedBy: input.checkedBy?.trim() || null,
      approvedBy: input.approvedBy?.trim() || null,
      remarks: input.remarks?.trim() || null,
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

  return formatTaDaBill(created);
};

export const updateTaDaBill = async (
  id: string,
  input: UpdateTaDaBillInput
): Promise<TaDaBillRecord> => {
  const existing = await prisma.taDaBill.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!existing) {
    throw new AppError('TA/DA bill not found.', 404);
  }

  if (input.billNo && input.billNo !== existing.billNo) {
    const duplicate = await prisma.taDaBill.findUnique({
      where: { billNo: input.billNo },
    });
    if (duplicate) {
      throw new AppError(`TA/DA bill number ${input.billNo} already exists.`, 400);
    }
  }

  let itemsCreateOrReplace = false;
  let newItemsData: { sl: number; date: Date | null; particular: string; vehicleName: string | null; qty: number; unitTaka: number; totalTaka: number; checkedBy: string | null }[] = [];
  let calculatedTotal = Number(existing.totalAmount);

  if (input.items && Array.isArray(input.items)) {
    itemsCreateOrReplace = true;
    calculatedTotal = 0;
    newItemsData = input.items.map((item, idx) => {
      const qty = Number(item.qty) || 1;
      const unitTaka = Number(item.unitTaka) || 0;
      const totalTaka = item.totalTaka !== undefined ? Number(item.totalTaka) : qty * unitTaka;
      calculatedTotal += totalTaka;

      return {
        sl: item.sl || idx + 1,
        date: item.date ? new Date(item.date) : null,
        particular: item.particular?.trim() || `Item ${idx + 1}`,
        vehicleName: item.vehicleName?.trim() || null,
        qty,
        unitTaka,
        totalTaka,
        checkedBy: item.checkedBy?.trim() || null,
      };
    });
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (itemsCreateOrReplace) {
      await tx.taDaItem.deleteMany({
        where: { taDaBillId: id },
      });
      await tx.taDaItem.createMany({
        data: newItemsData.map((d) => ({ ...d, taDaBillId: id })),
      });
    }

    return tx.taDaBill.update({
      where: { id },
      data: {
        billNo: input.billNo?.trim() || existing.billNo,
        submissionDate: input.submissionDate ? new Date(input.submissionDate) : existing.submissionDate,
        employeeName: input.employeeName?.trim() || existing.employeeName,
        designation: input.designation !== undefined ? input.designation?.trim() || null : existing.designation,
        employeeId: input.employeeId !== undefined ? input.employeeId?.trim() || null : existing.employeeId,
        department: input.department !== undefined ? input.department?.trim() || null : existing.department,
        totalAmount: calculatedTotal,
        status: input.status || existing.status,
        receivedBy: input.receivedBy !== undefined ? input.receivedBy?.trim() || null : existing.receivedBy,
        checkedBy: input.checkedBy !== undefined ? input.checkedBy?.trim() || null : existing.checkedBy,
        approvedBy: input.approvedBy !== undefined ? input.approvedBy?.trim() || null : existing.approvedBy,
        remarks: input.remarks !== undefined ? input.remarks?.trim() || null : existing.remarks,
      },
      include: {
        items: {
          orderBy: { sl: 'asc' },
        },
      },
    });
  });

  return formatTaDaBill(updated);
};

export const deleteTaDaBill = async (id: string): Promise<void> => {
  const existing = await prisma.taDaBill.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('TA/DA bill not found.', 404);
  }

  await prisma.taDaBill.delete({ where: { id } });
};

export const bulkDeleteTaDaBills = async (ids: string[]): Promise<number> => {
  if (!ids || ids.length === 0) {
    throw new AppError('No TA/DA bill IDs provided for deletion.', 400);
  }

  const result = await prisma.taDaBill.deleteMany({
    where: { id: { in: ids } },
  });

  return result.count;
};

export const exportTaDaCsv = async (query: TaDaFilterQuery): Promise<string> => {
  const where: Prisma.TaDaBillWhereInput = {};

  if (query.status && query.status !== 'ALL') where.status = query.status;
  if (query.startDate || query.endDate) {
    where.submissionDate = {};
    if (query.startDate) where.submissionDate.gte = new Date(query.startDate);
    if (query.endDate) where.submissionDate.lte = new Date(query.endDate);
  }

  const bills = await prisma.taDaBill.findMany({
    where,
    orderBy: { submissionDate: 'desc' },
    include: { items: true },
  });

  const headers = [
    'Bill No',
    'Submission Date',
    'Employee Name',
    'Designation',
    'Employee ID',
    'Total Amount (BDT)',
    'Status',
    'Received By',
    'Checked By',
    'Approved By',
  ];

  const rows = bills.map((b) => [
    `"${b.billNo}"`,
    `"${b.submissionDate instanceof Date ? b.submissionDate.toISOString().split('T')[0] : b.submissionDate}"`,
    `"${(b.employeeName || '').replace(/"/g, '""')}"`,
    `"${(b.designation || '').replace(/"/g, '""')}"`,
    `"${(b.employeeId || '').replace(/"/g, '""')}"`,
    `"${b.totalAmount}"`,
    `"${b.status}"`,
    `"${(b.receivedBy || '').replace(/"/g, '""')}"`,
    `"${(b.checkedBy || '').replace(/"/g, '""')}"`,
    `"${(b.approvedBy || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
};

