import { prisma } from '../config/prisma';
import { SalaryRecord, Prisma } from '@prisma/client';
import { 
  SalaryRecordData, 
  CreateSalaryInput, 
  UpdateSalaryInput, 
  SalaryFilterQuery, 
  SalaryListResponse, 
  SalaryPaymentStatus 
} from '../types';
import { AppError } from '../utils/appError';

export const formatSalary = (s: SalaryRecord): SalaryRecordData => ({
  id: s.id,
  month: s.month,
  employeeIdRef: s.employeeIdRef,
  employeeName: s.employeeName,
  employeeCode: s.employeeCode,
  designation: s.designation,
  department: s.department,
  basicSalary: Number(s.basicSalary),
  allowance: Number(s.allowance),
  totalDays: s.totalDays,
  presentDays: s.presentDays,
  absentDays: s.absentDays,
  totalEarnings: Number(s.totalEarnings),
  advanceLoan: Number(s.advanceLoan),
  previousDue: Number(s.previousDue),
  netPayable: Number(s.netPayable),
  paidAmount: Number(s.paidAmount),
  dueAmount: Number(s.dueAmount),
  paymentStatus: s.paymentStatus as SalaryPaymentStatus,
  paymentMethod: s.paymentMethod,
  paymentDate: s.paymentDate ? s.paymentDate.toISOString().split('T')[0] : null,
  notes: s.notes,
  createdById: s.createdById,
  createdAt: s.createdAt.toISOString(),
  updatedAt: s.updatedAt.toISOString(),
});

// Calculate dynamic fields according to company salary sheet formula
export const computeSalaryCalculations = (params: {
  basicSalary: number;
  allowance?: number;
  totalDays?: number;
  presentDays?: number;
  advanceLoan?: number;
  previousDue?: number;
  paidAmount?: number;
}) => {
  const basicSalary = Math.max(0, Number(params.basicSalary) || 0);
  const allowance = Math.max(0, Number(params.allowance) || 0);
  const totalDays = Math.max(1, Number(params.totalDays) || 30);
  const presentDays = Math.min(totalDays, Math.max(0, Number(params.presentDays ?? totalDays)));
  const absentDays = Math.max(0, totalDays - presentDays);

  // Daily basic rate = Basic / totalDays
  // Total Earnings = (dailyRate * presentDays) + allowance
  const dailyRate = basicSalary / totalDays;
  const earnedBasic = dailyRate * presentDays;
  const totalEarnings = Math.round((earnedBasic + allowance) * 100) / 100;

  const advanceLoan = Math.max(0, Number(params.advanceLoan) || 0);
  const previousDue = Math.max(0, Number(params.previousDue) || 0);

  // Net Salary Payable = Total Earnings - Advance Loan
  const netPayable = Math.max(0, Math.round((totalEarnings - advanceLoan) * 100) / 100);

  // Total Owed = Net Payable + Previous Month Due
  const totalOwed = Math.round((netPayable + previousDue) * 100) / 100;

  const paidAmount = Math.max(0, Number(params.paidAmount) || 0);
  const dueAmount = Math.max(0, Math.round((totalOwed - paidAmount) * 100) / 100);

  // Dynamic Payment Status
  let paymentStatus: SalaryPaymentStatus = 'UNPAID';
  if (paidAmount >= totalOwed && totalOwed > 0) {
    paymentStatus = 'PAID';
  } else if (paidAmount > 0 && dueAmount > 0) {
    paymentStatus = 'PARTIAL';
  } else if (totalOwed === 0 && paidAmount === 0) {
    paymentStatus = 'PAID';
  } else {
    paymentStatus = 'UNPAID';
  }

  return {
    basicSalary,
    allowance,
    totalDays,
    presentDays,
    absentDays,
    totalEarnings,
    advanceLoan,
    previousDue,
    netPayable,
    paidAmount,
    dueAmount,
    paymentStatus,
  };
};

export const getSalaryRecords = async (query: SalaryFilterQuery): Promise<SalaryListResponse> => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 15));
  const skip = (page - 1) * limit;

  const where: Prisma.SalaryRecordWhereInput = {};

  if (query.month && query.month !== 'ALL' && query.month.trim()) {
    where.month = query.month.trim();
  }

  if (query.department && query.department !== 'ALL' && query.department.trim()) {
    where.department = query.department.trim();
  }

  if (query.status && query.status !== 'ALL') {
    where.paymentStatus = query.status;
  }

  if (query.search && query.search.trim()) {
    const s = query.search.trim();
    where.OR = [
      { employeeName: { contains: s } },
      { employeeCode: { contains: s } },
      { designation: { contains: s } },
      { department: { contains: s } },
      { paymentMethod: { contains: s } },
    ];
  }

  const orderBy: Prisma.SalaryRecordOrderByWithRelationInput = {};
  const validSortCols = ['month', 'employeeCode', 'employeeName', 'totalEarnings', 'netPayable', 'paidAmount', 'dueAmount', 'createdAt'];
  const sortCol = query.sortBy && validSortCols.includes(query.sortBy) ? query.sortBy : 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
  orderBy[sortCol as keyof Prisma.SalaryRecordOrderByWithRelationInput] = sortOrder;

  const [items, total, allRecords, monthsGroup] = await Promise.all([
    prisma.salaryRecord.findMany({
      where,
      skip,
      take: limit,
      orderBy,
    }),
    prisma.salaryRecord.count({ where }),
    prisma.salaryRecord.findMany({
      where,
      select: {
        totalEarnings: true,
        netPayable: true,
        paidAmount: true,
        dueAmount: true,
        advanceLoan: true,
      },
    }),
    prisma.salaryRecord.groupBy({
      by: ['month'],
      orderBy: { month: 'desc' },
    }),
  ]);

  let totalEarnings = 0;
  let totalNetPayable = 0;
  let totalPaid = 0;
  let totalDue = 0;
  let totalAdvanceLoan = 0;

  for (const it of allRecords) {
    totalEarnings += Number(it.totalEarnings);
    totalNetPayable += Number(it.netPayable);
    totalPaid += Number(it.paidAmount);
    totalDue += Number(it.dueAmount);
    totalAdvanceLoan += Number(it.advanceLoan);
  }

  return {
    items: items.map(formatSalary),
    total,
    totalEarnings,
    totalNetPayable,
    totalPaid,
    totalDue,
    totalAdvanceLoan,
    totalEmployees: total,
    distinctMonths: monthsGroup.map((m) => m.month),
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getSalaryRecordById = async (id: string): Promise<SalaryRecordData> => {
  const item = await prisma.salaryRecord.findUnique({
    where: { id },
  });

  if (!item) {
    throw new AppError('Salary record not found', 404);
  }

  return formatSalary(item);
};

export const createSalaryRecord = async (
  input: CreateSalaryInput,
  userId?: string
): Promise<SalaryRecordData> => {
  if (!input.month || !input.month.trim()) {
    throw new AppError('Salary Month is required (e.g. "Jun 2026")', 400);
  }

  if (!input.employeeName || !input.employeeName.trim()) {
    throw new AppError('Employee Name is required', 400);
  }

  const calc = computeSalaryCalculations({
    basicSalary: input.basicSalary,
    allowance: input.allowance,
    totalDays: input.totalDays,
    presentDays: input.presentDays,
    advanceLoan: input.advanceLoan,
    previousDue: input.previousDue,
    paidAmount: input.paidAmount,
  });

  const record = await prisma.salaryRecord.create({
    data: {
      month: input.month.trim(),
      employeeIdRef: input.employeeIdRef || null,
      employeeName: input.employeeName.trim(),
      employeeCode: input.employeeCode?.trim() || 'EMP',
      designation: input.designation?.trim() || 'Staff',
      department: input.department?.trim() || 'Operations',
      basicSalary: new Prisma.Decimal(calc.basicSalary),
      allowance: new Prisma.Decimal(calc.allowance),
      totalDays: calc.totalDays,
      presentDays: calc.presentDays,
      absentDays: calc.absentDays,
      totalEarnings: new Prisma.Decimal(calc.totalEarnings),
      advanceLoan: new Prisma.Decimal(calc.advanceLoan),
      previousDue: new Prisma.Decimal(calc.previousDue),
      netPayable: new Prisma.Decimal(calc.netPayable),
      paidAmount: new Prisma.Decimal(calc.paidAmount),
      dueAmount: new Prisma.Decimal(calc.dueAmount),
      paymentStatus: calc.paymentStatus,
      paymentMethod: input.paymentMethod?.trim() || null,
      paymentDate: input.paymentDate ? new Date(input.paymentDate) : (calc.paidAmount > 0 ? new Date() : null),
      notes: input.notes?.trim() || null,
      createdById: userId || null,
    },
  });

  return formatSalary(record);
};

export const updateSalaryRecord = async (
  id: string,
  input: UpdateSalaryInput
): Promise<SalaryRecordData> => {
  const existing = await prisma.salaryRecord.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Salary record not found', 404);
  }

  const calc = computeSalaryCalculations({
    basicSalary: input.basicSalary !== undefined ? input.basicSalary : Number(existing.basicSalary),
    allowance: input.allowance !== undefined ? input.allowance : Number(existing.allowance),
    totalDays: input.totalDays !== undefined ? input.totalDays : existing.totalDays,
    presentDays: input.presentDays !== undefined ? input.presentDays : existing.presentDays,
    advanceLoan: input.advanceLoan !== undefined ? input.advanceLoan : Number(existing.advanceLoan),
    previousDue: input.previousDue !== undefined ? input.previousDue : Number(existing.previousDue),
    paidAmount: input.paidAmount !== undefined ? input.paidAmount : Number(existing.paidAmount),
  });

  const updated = await prisma.salaryRecord.update({
    where: { id },
    data: {
      month: input.month !== undefined ? input.month.trim() : existing.month,
      employeeName: input.employeeName !== undefined ? input.employeeName.trim() : existing.employeeName,
      employeeCode: input.employeeCode !== undefined ? input.employeeCode.trim() : existing.employeeCode,
      designation: input.designation !== undefined ? input.designation.trim() : existing.designation,
      department: input.department !== undefined ? input.department.trim() : existing.department,
      basicSalary: new Prisma.Decimal(calc.basicSalary),
      allowance: new Prisma.Decimal(calc.allowance),
      totalDays: calc.totalDays,
      presentDays: calc.presentDays,
      absentDays: calc.absentDays,
      totalEarnings: new Prisma.Decimal(calc.totalEarnings),
      advanceLoan: new Prisma.Decimal(calc.advanceLoan),
      previousDue: new Prisma.Decimal(calc.previousDue),
      netPayable: new Prisma.Decimal(calc.netPayable),
      paidAmount: new Prisma.Decimal(calc.paidAmount),
      dueAmount: new Prisma.Decimal(calc.dueAmount),
      paymentStatus: calc.paymentStatus,
      paymentMethod: input.paymentMethod !== undefined ? (input.paymentMethod?.trim() || null) : existing.paymentMethod,
      paymentDate: input.paymentDate !== undefined 
        ? (input.paymentDate ? new Date(input.paymentDate) : null) 
        : existing.paymentDate,
      notes: input.notes !== undefined ? (input.notes?.trim() || null) : existing.notes,
    },
  });

  return formatSalary(updated);
};

export const deleteSalaryRecord = async (id: string): Promise<void> => {
  const existing = await prisma.salaryRecord.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Salary record not found', 404);
  }

  await prisma.salaryRecord.delete({ where: { id } });
};

export const bulkDeleteSalaryRecords = async (ids: string[]): Promise<number> => {
  if (!ids || ids.length === 0) return 0;
  const res = await prisma.salaryRecord.deleteMany({
    where: { id: { in: ids } },
  });
  return res.count;
};

export const exportSalaryCsv = async (query: SalaryFilterQuery): Promise<string> => {
  const where: Prisma.SalaryRecordWhereInput = {};

  if (query.month && query.month !== 'ALL' && query.month.trim()) {
    where.month = query.month.trim();
  }

  if (query.department && query.department !== 'ALL' && query.department.trim()) {
    where.department = query.department.trim();
  }

  if (query.status && query.status !== 'ALL') {
    where.paymentStatus = query.status;
  }

  if (query.search && query.search.trim()) {
    const s = query.search.trim();
    where.OR = [
      { employeeName: { contains: s } },
      { employeeCode: { contains: s } },
      { designation: { contains: s } },
      { department: { contains: s } },
    ];
  }

  const items = await prisma.salaryRecord.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  const header = [
    'SL No',
    'Employee Name',
    'Employee ID',
    'Designation',
    'Department',
    'Basic Salary',
    'Mobile & other allowance',
    'Present Days',
    'Absent Days',
    'Total Earnings',
    'Advance loan',
    'Previous month Due Amount',
    'Net Salary Payable',
    'Paid Amount',
    'Due Amount',
    'Cash/Method',
    'Payment Status',
  ];

  const rows = items.map((r, idx) => [
    idx + 1,
    `"${r.employeeName.replace(/"/g, '""')}"`,
    `"${r.employeeCode}"`,
    `"${r.designation.replace(/"/g, '""')}"`,
    `"${r.department.replace(/"/g, '""')}"`,
    Number(r.basicSalary).toFixed(2),
    Number(r.allowance).toFixed(2),
    r.presentDays,
    r.absentDays,
    Number(r.totalEarnings).toFixed(2),
    Number(r.advanceLoan).toFixed(2),
    Number(r.previousDue).toFixed(2),
    Number(r.netPayable).toFixed(2),
    Number(r.paidAmount).toFixed(2),
    Number(r.dueAmount).toFixed(2),
    `"${(r.paymentMethod || '').replace(/"/g, '""')}"`,
    r.paymentStatus,
  ]);

  return '\uFEFF' + [header.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
};

