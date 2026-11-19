import { prisma } from '../config/prisma';
import { OfficeRent, Prisma } from '@prisma/client';
import { 
  CreateOfficeRentInput, 
  UpdateOfficeRentInput, 
  OfficeRentFilterQuery, 
  OfficeRentListResponse, 
  OfficeRentRecord, 
  RentPaymentStatus 
} from '../types';
import { AppError } from '../utils/appError';

const formatRentRecord = (item: OfficeRent): OfficeRentRecord => ({
  id: item.id,
  month: item.month,
  title: item.title,
  amount: Number(item.amount),
  status: item.status as RentPaymentStatus,
  paymentDate: item.paymentDate ? item.paymentDate.toISOString().split('T')[0] : null,
  paymentMethod: item.paymentMethod,
  landlordName: item.landlordName,
  receiptNo: item.receiptNo,
  note: item.note,
  createdById: item.createdById,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
});

export const getOfficeRents = async (query: OfficeRentFilterQuery): Promise<OfficeRentListResponse> => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const where: Prisma.OfficeRentWhereInput = {};

  if (query.status && query.status !== 'ALL') {
    where.status = query.status;
  }

  if (query.month && query.month.trim()) {
    where.month = {
      contains: query.month.trim(),
    };
  }

  if (query.search && query.search.trim()) {
    const s = query.search.trim();
    where.OR = [
      { month: { contains: s } },
      { title: { contains: s } },
      { landlordName: { contains: s } },
      { receiptNo: { contains: s } },
      { paymentMethod: { contains: s } },
      { note: { contains: s } },
    ];
  }

  const orderBy: Prisma.OfficeRentOrderByWithRelationInput = {};
  const validSortCols = ['month', 'amount', 'status', 'paymentDate', 'createdAt'];
  const sortCol = query.sortBy && validSortCols.includes(query.sortBy) ? query.sortBy : 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  orderBy[sortCol as keyof Prisma.OfficeRentOrderByWithRelationInput] = sortOrder;

  const [items, total, allMatching] = await Promise.all([
    prisma.officeRent.findMany({
      where,
      skip,
      take: limit,
      orderBy,
    }),
    prisma.officeRent.count({ where }),
    prisma.officeRent.findMany({
      where,
      select: {
        amount: true,
        status: true,
      },
    }),
  ]);

  let totalAmount = 0;
  let totalPaidAmount = 0;
  let totalUnpaidAmount = 0;
  let totalPaidCount = 0;
  let totalUnpaidCount = 0;

  for (const it of allMatching) {
    const amt = Number(it.amount);
    totalAmount += amt;
    if (it.status === 'PAID') {
      totalPaidAmount += amt;
      totalPaidCount += 1;
    } else {
      totalUnpaidAmount += amt;
      totalUnpaidCount += 1;
    }
  }

  return {
    items: items.map(formatRentRecord),
    total,
    totalAmount,
    totalPaidAmount,
    totalUnpaidAmount,
    totalPaidCount,
    totalUnpaidCount,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getOfficeRentById = async (id: string): Promise<OfficeRentRecord> => {
  const item = await prisma.officeRent.findUnique({
    where: { id },
  });

  if (!item) {
    throw new AppError('Office rent record not found', 404);
  }

  return formatRentRecord(item);
};

export const createOfficeRent = async (
  input: CreateOfficeRentInput, 
  userId?: string
): Promise<OfficeRentRecord> => {
  if (!input.month || !input.month.trim()) {
    throw new AppError('Month is required (e.g. "June 2026")', 400);
  }

  if (input.amount === undefined || isNaN(Number(input.amount)) || Number(input.amount) < 0) {
    throw new AppError('Valid rent amount is required', 400);
  }

  const rent = await prisma.officeRent.create({
    data: {
      month: input.month.trim(),
      title: input.title?.trim() || 'Office rent',
      amount: new Prisma.Decimal(input.amount),
      status: input.status || 'UNPAID',
      paymentDate: input.paymentDate ? new Date(input.paymentDate) : null,
      paymentMethod: input.paymentMethod?.trim() || null,
      landlordName: input.landlordName?.trim() || null,
      receiptNo: input.receiptNo?.trim() || null,
      note: input.note?.trim() || null,
      createdById: userId || null,
    },
  });

  return formatRentRecord(rent);
};

export const updateOfficeRent = async (
  id: string, 
  input: UpdateOfficeRentInput
): Promise<OfficeRentRecord> => {
  const existing = await prisma.officeRent.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Office rent record not found', 404);
  }

  const updateData: Prisma.OfficeRentUpdateInput = {};

  if (input.month !== undefined) {
    if (!input.month.trim()) throw new AppError('Month cannot be empty', 400);
    updateData.month = input.month.trim();
  }

  if (input.title !== undefined) {
    updateData.title = input.title.trim() || 'Office rent';
  }

  if (input.amount !== undefined) {
    if (isNaN(Number(input.amount)) || Number(input.amount) < 0) {
      throw new AppError('Valid rent amount is required', 400);
    }
    updateData.amount = new Prisma.Decimal(input.amount);
  }

  if (input.status !== undefined) {
    updateData.status = input.status;
  }

  if (input.paymentDate !== undefined) {
    updateData.paymentDate = input.paymentDate ? new Date(input.paymentDate) : null;
  }

  if (input.paymentMethod !== undefined) {
    updateData.paymentMethod = input.paymentMethod ? input.paymentMethod.trim() : null;
  }

  if (input.landlordName !== undefined) {
    updateData.landlordName = input.landlordName ? input.landlordName.trim() : null;
  }

  if (input.receiptNo !== undefined) {
    updateData.receiptNo = input.receiptNo ? input.receiptNo.trim() : null;
  }

  if (input.note !== undefined) {
    updateData.note = input.note ? input.note.trim() : null;
  }

  const updated = await prisma.officeRent.update({
    where: { id },
    data: updateData,
  });

  return formatRentRecord(updated);
};

export const deleteOfficeRent = async (id: string): Promise<void> => {
  const existing = await prisma.officeRent.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Office rent record not found', 404);
  }

  await prisma.officeRent.delete({ where: { id } });
};

export const bulkDeleteOfficeRents = async (ids: string[]): Promise<number> => {
  if (!ids || ids.length === 0) return 0;
  const res = await prisma.officeRent.deleteMany({
    where: { id: { in: ids } },
  });
  return res.count;
};

export const exportOfficeRentsCsv = async (query: OfficeRentFilterQuery): Promise<string> => {
  const where: Prisma.OfficeRentWhereInput = {};

  if (query.status && query.status !== 'ALL') {
    where.status = query.status;
  }

  if (query.month && query.month.trim()) {
    where.month = { contains: query.month.trim() };
  }

  if (query.search && query.search.trim()) {
    const s = query.search.trim();
    where.OR = [
      { month: { contains: s } },
      { title: { contains: s } },
      { landlordName: { contains: s } },
      { receiptNo: { contains: s } },
      { paymentMethod: { contains: s } },
      { note: { contains: s } },
    ];
  }

  const items = await prisma.officeRent.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  const header = ['Month', 'Title', 'Amount (BDT)', 'Status', 'Payment Date', 'Payment Method', 'Landlord / Premise', 'Receipt No', 'Note'];
  const rows = items.map((r) => [
    `"${r.month.replace(/"/g, '""')}"`,
    `"${r.title.replace(/"/g, '""')}"`,
    Number(r.amount).toFixed(2),
    r.status,
    r.paymentDate ? r.paymentDate.toISOString().split('T')[0] : '',
    `"${(r.paymentMethod || '').replace(/"/g, '""')}"`,
    `"${(r.landlordName || '').replace(/"/g, '""')}"`,
    `"${(r.receiptNo || '').replace(/"/g, '""')}"`,
    `"${(r.note || '').replace(/"/g, '""')}"`,
  ]);

  return '\uFEFF' + [header.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
};

