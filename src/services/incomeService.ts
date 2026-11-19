import { prisma } from '../config/prisma';
import { Income, Prisma } from '@prisma/client';
import { 
  CreateIncomeInput, 
  UpdateIncomeInput, 
  IncomeFilterQuery, 
  IncomeListResponse, 
  IncomeRecord,
  PaymentStatus 
} from '../types';
import { AppError } from '../utils/appError';
import * as XLSX from 'xlsx';

// Helper to format Prisma income to IncomeRecord
const formatIncome = (item: Income): IncomeRecord => ({
  id: item.id,
  date: item.date instanceof Date ? item.date.toISOString().split('T')[0] : String(item.date),
  companyOrStoreName: item.companyOrStoreName,
  amount: Number(item.amount),
  status: item.status as PaymentStatus,
  remarks: item.remarks,
  createdById: item.createdById,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

// Helper to parse dates from various formats (Excel serial number or DD/MM/YYYY or YYYY-MM-DD)
export const parseFlexibleDate = (val: unknown): Date => {
  if (!val) return new Date();
  if (val instanceof Date) return val;

  // Handle Excel serial date number (e.g. 46177)
  if (typeof val === 'number' || (!isNaN(Number(val)) && !String(val).includes('-') && !String(val).includes('/'))) {
    const serial = Number(val);
    const utcDays = Math.floor(serial - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    return date;
  }

  const str = String(val).trim();

  // Handle DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [day, month, year] = str.split('/').map(Number);
    return new Date(year, month - 1, day);
  }

  // Handle DD-MM-YYYY
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(str)) {
    const [day, month, year] = str.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return new Date();
};

export const getIncomes = async (query: IncomeFilterQuery): Promise<IncomeListResponse> => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const where: Prisma.IncomeWhereInput = {};

  // Status Filter
  if (query.status && query.status !== 'ALL') {
    where.status = query.status;
  }

  // Search filter
  if (query.search && query.search.trim()) {
    const term = query.search.trim();
    where.OR = [
      { companyOrStoreName: { contains: term } },
      { remarks: { contains: term } },
    ];
  }

  // Date range filter
  if (query.startDate || query.endDate) {
    where.date = {};
    if (query.startDate) {
      where.date.gte = parseFlexibleDate(query.startDate);
    }
    if (query.endDate) {
      where.date.lte = parseFlexibleDate(query.endDate);
    }
  }

  // Sorting
  const sortBy = query.sortBy || 'date';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
  const orderBy: Prisma.IncomeOrderByWithRelationInput = {};
  if (sortBy === 'amount' || sortBy === 'date' || sortBy === 'companyOrStoreName' || sortBy === 'status') {
    orderBy[sortBy] = sortOrder;
  } else {
    orderBy.date = 'desc';
  }

  // Execute query and total count
  const [items, total] = await Promise.all([
    prisma.income.findMany({
      where,
      skip,
      take: limit,
      orderBy: [orderBy, { createdAt: 'desc' }],
    }),
    prisma.income.count({ where }),
  ]);

  // Aggregate sums across the filtered dataset
  const aggregates = await prisma.income.groupBy({
    by: ['status'],
    where,
    _sum: {
      amount: true,
    },
  });

  let totalAmount = 0;
  let paidAmount = 0;
  let unpaidAmount = 0;

  for (const agg of aggregates) {
    const sum = Number(agg._sum.amount || 0);
    totalAmount += sum;
    if (agg.status === 'PAID') {
      paidAmount += sum;
    } else if (agg.status === 'UNPAID') {
      unpaidAmount += sum;
    }
  }

  return {
    items: items.map(formatIncome),
    total,
    totalAmount,
    paidAmount,
    unpaidAmount,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};

export const getIncomeById = async (id: string): Promise<IncomeRecord> => {
  const item = await prisma.income.findUnique({
    where: { id },
  });

  if (!item) {
    throw new AppError('Income record not found', 404);
  }

  return formatIncome(item);
};

export const createIncome = async (
  input: CreateIncomeInput,
  userId?: string
): Promise<IncomeRecord> => {
  if (!input.companyOrStoreName || !input.companyOrStoreName.trim()) {
    throw new AppError('Company or store name is required', 400);
  }

  if (input.amount === undefined || isNaN(Number(input.amount)) || Number(input.amount) < 0) {
    throw new AppError('A valid positive amount is required', 400);
  }

  const date = parseFlexibleDate(input.date);
  const status = input.status === 'UNPAID' ? 'UNPAID' : 'PAID';

  const created = await prisma.income.create({
    data: {
      date,
      companyOrStoreName: input.companyOrStoreName.trim(),
      amount: input.amount,
      status,
      remarks: input.remarks ? input.remarks.trim() : null,
      createdById: userId || null,
    },
  });

  return formatIncome(created);
};

export const updateIncome = async (
  id: string,
  input: UpdateIncomeInput
): Promise<IncomeRecord> => {
  const existing = await prisma.income.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Income record not found', 404);
  }

  const data: Prisma.IncomeUpdateInput = {};
  if (input.companyOrStoreName !== undefined) {
    if (!input.companyOrStoreName.trim()) {
      throw new AppError('Company or store name cannot be empty', 400);
    }
    data.companyOrStoreName = input.companyOrStoreName.trim();
  }

  if (input.amount !== undefined) {
    if (isNaN(Number(input.amount)) || Number(input.amount) < 0) {
      throw new AppError('A valid positive amount is required', 400);
    }
    data.amount = input.amount;
  }

  if (input.date !== undefined) {
    data.date = parseFlexibleDate(input.date);
  }

  if (input.status !== undefined) {
    data.status = input.status === 'UNPAID' ? 'UNPAID' : 'PAID';
  }

  if (input.remarks !== undefined) {
    data.remarks = input.remarks ? input.remarks.trim() : null;
  }

  const updated = await prisma.income.update({
    where: { id },
    data,
  });

  return formatIncome(updated);
};

export const deleteIncome = async (id: string): Promise<void> => {
  const existing = await prisma.income.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Income record not found', 404);
  }

  await prisma.income.delete({ where: { id } });
};

export const bulkDeleteIncomes = async (ids: string[]): Promise<number> => {
  if (!ids || ids.length === 0) {
    throw new AppError('No income IDs provided for deletion', 400);
  }

  const result = await prisma.income.deleteMany({
    where: {
      id: { in: ids },
    },
  });

  return result.count;
};

export const importIncomesFromBuffer = async (
  buffer: Buffer,
  userId?: string
): Promise<{ count: number; items: IncomeRecord[] }> => {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new AppError('Uploaded file contains no worksheets', 400);
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][];

  if (rows.length === 0) {
    throw new AppError('Worksheet is empty', 400);
  }

  // Search for the header row
  let headerIndex = -1;
  let dateColIdx = -1;
  let companyColIdx = -1;
  let amountColIdx = -1;
  let statusColIdx = -1;
  let remarksColIdx = -1;

  for (let r = 0; r < Math.min(rows.length, 25); r++) {
    const row = rows[r].map((cell: unknown) => String(cell || '').trim().toLowerCase());
    for (let c = 0; c < row.length; c++) {
      const val = row[c];
      if (val === 'date' || val === 'তারিখ') dateColIdx = c;
      if (val.includes('company') || val.includes('store') || val.includes('বিবরণ') || val.includes('নাম') || val.includes('particular')) companyColIdx = c;
      if (val.includes('income') || val.includes('total') || val.includes('amount') || val.includes('টাকা') || val.includes('পরিমাণ')) amountColIdx = c;
      if (val.includes('status') || val.includes('অবস্থা')) statusColIdx = c;
      if (val.includes('remark') || val.includes('note') || val.includes('মন্তব্য')) remarksColIdx = c;
    }

    if (companyColIdx !== -1 && amountColIdx !== -1) {
      headerIndex = r;
      break;
    }
  }

  // Fallback defaults if explicit headers not matched: col 1 = date, col 2 = company, col 3 = amount
  if (headerIndex === -1) {
    headerIndex = 0;
    dateColIdx = 1;
    companyColIdx = 2;
    amountColIdx = 3;
  }

  const validEntries: Array<{
    date: Date;
    companyOrStoreName: string;
    amount: number;
    status: PaymentStatus;
    remarks: string | null;
    createdById: string | null;
  }> = [];

  for (let r = headerIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const companyRaw = companyColIdx !== -1 ? row[companyColIdx] : '';
    const amountRaw = amountColIdx !== -1 ? row[amountColIdx] : '';
    const dateRaw = dateColIdx !== -1 ? row[dateColIdx] : '';
    const statusRaw = statusColIdx !== -1 ? row[statusColIdx] : '';
    const remarksRaw = remarksColIdx !== -1 ? row[remarksColIdx] : '';

    const companyStr = String(companyRaw || '').trim();
    if (!companyStr || companyStr.toLowerCase() === 'total' || companyStr.toLowerCase() === 'মোট') {
      continue;
    }

    // Clean amount (remove commas, currency symbols, spaces)
    const cleanedAmountStr = String(amountRaw).replace(/[^0-9.-]+/g, '');
    const amountNum = parseFloat(cleanedAmountStr);
    if (isNaN(amountNum) || amountNum <= 0) {
      continue;
    }

    const date = parseFlexibleDate(dateRaw);
    let status: PaymentStatus = 'PAID';
    if (String(statusRaw).toLowerCase().includes('unpaid') || String(statusRaw).toLowerCase().includes('বকেয়া')) {
      status = 'UNPAID';
    }

    validEntries.push({
      date,
      companyOrStoreName: companyStr,
      amount: amountNum,
      status,
      remarks: remarksRaw ? String(remarksRaw).trim() : null,
      createdById: userId || null,
    });
  }

  if (validEntries.length === 0) {
    throw new AppError('No valid income rows found in file. Please ensure columns include Date, Company/Store Name, and Total Income.', 400);
  }

  // Insert rows
  await prisma.income.createMany({
    data: validEntries,
  });

  // Fetch recent created records
  const recent = await prisma.income.findMany({
    orderBy: { createdAt: 'desc' },
    take: validEntries.length,
  });

  return {
    count: validEntries.length,
    items: recent.map(formatIncome),
  };
};
