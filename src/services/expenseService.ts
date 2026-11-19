import { prisma } from '../config/prisma';
import { Expense, Prisma } from '@prisma/client';
import { 
  CreateExpenseInput, 
  UpdateExpenseInput, 
  ExpenseFilterQuery, 
  ExpenseListResponse, 
  ExpenseRecord,
  PaymentStatus 
} from '../types';
import { AppError } from '../utils/appError';
import { parseFlexibleDate } from './incomeService';
import * as XLSX from 'xlsx';

// Helper to format Prisma expense to ExpenseRecord
const formatExpense = (item: Expense): ExpenseRecord => ({
  id: item.id,
  date: item.date instanceof Date ? item.date.toISOString().split('T')[0] : String(item.date),
  companyOrStoreName: item.companyOrStoreName,
  amount: Number(item.amount),
  status: item.status as PaymentStatus,
  category: item.category,
  remarks: item.remarks,
  createdById: item.createdById,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

export const getExpenses = async (query: ExpenseFilterQuery): Promise<ExpenseListResponse> => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const where: Prisma.ExpenseWhereInput = {};

  // Status Filter
  if (query.status && query.status !== 'ALL') {
    where.status = query.status;
  }

  // Category Filter
  if (query.category && query.category.trim()) {
    where.category = query.category.trim();
  }

  // Search filter
  if (query.search && query.search.trim()) {
    const term = query.search.trim();
    where.OR = [
      { companyOrStoreName: { contains: term } },
      { category: { contains: term } },
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
  const orderBy: Prisma.ExpenseOrderByWithRelationInput = {};
  if (sortBy === 'amount' || sortBy === 'date' || sortBy === 'companyOrStoreName' || sortBy === 'status') {
    orderBy[sortBy] = sortOrder;
  } else {
    orderBy.date = 'desc';
  }

  // Execute query and total count
  const [items, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      skip,
      take: limit,
      orderBy: [orderBy, { createdAt: 'desc' }],
    }),
    prisma.expense.count({ where }),
  ]);

  // Aggregate sums across the filtered dataset
  const aggregates = await prisma.expense.groupBy({
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
    items: items.map(formatExpense),
    total,
    totalAmount,
    paidAmount,
    unpaidAmount,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};

export const getExpenseById = async (id: string): Promise<ExpenseRecord> => {
  const item = await prisma.expense.findUnique({
    where: { id },
  });

  if (!item) {
    throw new AppError('Expense record not found', 404);
  }

  return formatExpense(item);
};

export const createExpense = async (
  input: CreateExpenseInput,
  userId?: string
): Promise<ExpenseRecord> => {
  if (!input.companyOrStoreName || !input.companyOrStoreName.trim()) {
    throw new AppError('Company, store, or expense description is required', 400);
  }

  if (input.amount === undefined || isNaN(Number(input.amount)) || Number(input.amount) < 0) {
    throw new AppError('A valid positive amount is required', 400);
  }

  const date = parseFlexibleDate(input.date);
  const status = input.status === 'UNPAID' ? 'UNPAID' : 'PAID';

  const created = await prisma.expense.create({
    data: {
      date,
      companyOrStoreName: input.companyOrStoreName.trim(),
      amount: input.amount,
      status,
      category: input.category ? input.category.trim() : null,
      remarks: input.remarks ? input.remarks.trim() : null,
      createdById: userId || null,
    },
  });

  return formatExpense(created);
};

export const updateExpense = async (
  id: string,
  input: UpdateExpenseInput
): Promise<ExpenseRecord> => {
  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Expense record not found', 404);
  }

  const data: Prisma.ExpenseUpdateInput = {};
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

  if (input.category !== undefined) {
    data.category = input.category ? input.category.trim() : null;
  }

  if (input.remarks !== undefined) {
    data.remarks = input.remarks ? input.remarks.trim() : null;
  }

  const updated = await prisma.expense.update({
    where: { id },
    data,
  });

  return formatExpense(updated);
};

export const deleteExpense = async (id: string): Promise<void> => {
  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Expense record not found', 404);
  }

  await prisma.expense.delete({ where: { id } });
};

export const bulkDeleteExpenses = async (ids: string[]): Promise<number> => {
  if (!ids || ids.length === 0) {
    throw new AppError('No expense IDs provided for deletion', 400);
  }

  const result = await prisma.expense.deleteMany({
    where: {
      id: { in: ids },
    },
  });

  return result.count;
};

export const importExpensesFromBuffer = async (
  buffer: Buffer,
  userId?: string
): Promise<{ count: number; items: ExpenseRecord[] }> => {
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
      if (val.includes('company') || val.includes('store') || val.includes('বিবরণ') || val.includes('নাম') || val.includes('particular') || val.includes('খাত')) companyColIdx = c;
      if (val.includes('cost') || val.includes('expense') || val.includes('total') || val.includes('amount') || val.includes('টাকা') || val.includes('খরচ')) amountColIdx = c;
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
    category: string | null;
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
    if (!companyStr || companyStr.toLowerCase() === 'total' || companyStr.toLowerCase() === 'মোট' || companyStr.toLowerCase().includes('total:')) {
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
      category: null,
      remarks: remarksRaw ? String(remarksRaw).trim() : null,
      createdById: userId || null,
    });
  }

  if (validEntries.length === 0) {
    throw new AppError('No valid expense rows found in file. Please ensure columns include Date, Company/Store Name, and Total Cost.', 400);
  }

  // Insert rows
  await prisma.expense.createMany({
    data: validEntries,
  });

  // Fetch recent created records
  const recent = await prisma.expense.findMany({
    orderBy: { createdAt: 'desc' },
    take: validEntries.length,
  });

  return {
    count: validEntries.length,
    items: recent.map(formatExpense),
  };
};

