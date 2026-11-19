import { prisma } from '../config/prisma';
import { Employee, Prisma } from '@prisma/client';
import { 
  EmployeeRecord, 
  CreateEmployeeInput, 
  UpdateEmployeeInput, 
  EmployeeFilterQuery, 
  EmployeeListResponse, 
  EmployeeStatus 
} from '../types';
import { AppError } from '../utils/appError';

export const formatEmployee = (e: Employee): EmployeeRecord => ({
  id: e.id,
  employeeId: e.employeeId,
  name: e.name,
  email: e.email,
  phone: e.phone,
  designation: e.designation,
  department: e.department,
  basicSalary: Number(e.basicSalary),
  allowance: Number(e.allowance),
  grossSalary: Number(e.grossSalary),
  joinDate: e.joinDate ? e.joinDate.toISOString().split('T')[0] : null,
  status: e.status as EmployeeStatus,
  address: e.address,
  notes: e.notes,
  createdById: e.createdById,
  createdAt: e.createdAt.toISOString(),
  updatedAt: e.updatedAt.toISOString(),
});

export const generateNextEmployeeId = async (): Promise<string> => {
  const lastEmp = await prisma.employee.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { employeeId: true },
  });

  if (!lastEmp || !lastEmp.employeeId) {
    return 'EMP-001';
  }

  const match = lastEmp.employeeId.match(/EMP-(\d+)/i);
  if (match) {
    const nextSeq = parseInt(match[1], 10) + 1;
    return `EMP-${String(nextSeq).padStart(3, '0')}`;
  }

  const count = await prisma.employee.count();
  return `EMP-${String(count + 1).padStart(3, '0')}`;
};

export const getEmployees = async (query: EmployeeFilterQuery): Promise<EmployeeListResponse> => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const where: Prisma.EmployeeWhereInput = {};

  if (query.status && query.status !== 'ALL') {
    where.status = query.status;
  }

  if (query.department && query.department.trim()) {
    where.department = query.department.trim();
  }

  if (query.search && query.search.trim()) {
    const s = query.search.trim();
    where.OR = [
      { employeeId: { contains: s } },
      { name: { contains: s } },
      { email: { contains: s } },
      { phone: { contains: s } },
      { designation: { contains: s } },
      { department: { contains: s } },
    ];
  }

  const orderBy: Prisma.EmployeeOrderByWithRelationInput = {};
  const validSortCols = ['employeeId', 'name', 'department', 'basicSalary', 'grossSalary', 'createdAt', 'status'];
  const sortCol = query.sortBy && validSortCols.includes(query.sortBy) ? query.sortBy : 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
  orderBy[sortCol as keyof Prisma.EmployeeOrderByWithRelationInput] = sortOrder;

  const [items, total, allRecords] = await Promise.all([
    prisma.employee.findMany({
      where,
      skip,
      take: limit,
      orderBy,
    }),
    prisma.employee.count({ where }),
    prisma.employee.findMany({
      where,
      select: { basicSalary: true, allowance: true, grossSalary: true, status: true },
    }),
  ]);

  let totalBasicSalary = 0;
  let totalAllowance = 0;
  let totalPayroll = 0;
  let totalActive = 0;
  let totalInactive = 0;

  for (const it of allRecords) {
    const basic = Number(it.basicSalary);
    const allow = Number(it.allowance);
    const gross = Number(it.grossSalary);
    totalBasicSalary += basic;
    totalAllowance += allow;
    totalPayroll += gross;
    if (it.status === 'ACTIVE') {
      totalActive++;
    } else {
      totalInactive++;
    }
  }

  return {
    items: items.map(formatEmployee),
    total,
    totalBasicSalary,
    totalAllowance,
    totalPayroll,
    totalActive,
    totalInactive,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getEmployeeById = async (id: string): Promise<EmployeeRecord> => {
  const emp = await prisma.employee.findUnique({
    where: { id },
  });

  if (!emp) {
    throw new AppError('Employee not found', 404);
  }

  return formatEmployee(emp);
};

export const createEmployee = async (
  input: CreateEmployeeInput,
  userId?: string
): Promise<EmployeeRecord> => {
  const trimmedName = input.name?.trim();
  if (!trimmedName) throw new AppError('Employee Name is required', 400);

  const trimmedEmail = input.email?.trim().toLowerCase();
  if (!trimmedEmail) throw new AppError('Employee Email is required', 400);

  const basic = Number(input.basicSalary);
  if (isNaN(basic) || basic < 0) {
    throw new AppError('Valid Basic Salary is required', 400);
  }

  const allowance = Number(input.allowance || 0);
  if (isNaN(allowance) || allowance < 0) {
    throw new AppError('Allowance must be a valid non-negative number', 400);
  }

  const gross = basic + allowance;
  const empId = input.employeeId?.trim() || (await generateNextEmployeeId());

  // Check unique employeeId
  const existingId = await prisma.employee.findUnique({ where: { employeeId: empId } });
  if (existingId) {
    throw new AppError(`Employee ID "${empId}" is already registered`, 409);
  }

  const emp = await prisma.employee.create({
    data: {
      employeeId: empId,
      name: trimmedName,
      email: trimmedEmail,
      phone: input.phone?.trim() || null,
      designation: input.designation?.trim() || 'Staff',
      department: input.department?.trim() || 'General Operations',
      basicSalary: new Prisma.Decimal(basic),
      allowance: new Prisma.Decimal(allowance),
      grossSalary: new Prisma.Decimal(gross),
      joinDate: input.joinDate ? new Date(input.joinDate) : new Date(),
      status: input.status || 'ACTIVE',
      address: input.address?.trim() || null,
      notes: input.notes?.trim() || null,
      createdById: userId || null,
    },
  });

  return formatEmployee(emp);
};

export const updateEmployee = async (
  id: string,
  input: UpdateEmployeeInput
): Promise<EmployeeRecord> => {
  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Employee not found', 404);
  }

  const updateData: Prisma.EmployeeUpdateInput = {};

  if (input.name !== undefined) {
    if (!input.name.trim()) throw new AppError('Name cannot be empty', 400);
    updateData.name = input.name.trim();
  }

  if (input.email !== undefined) {
    if (!input.email.trim()) throw new AppError('Email cannot be empty', 400);
    updateData.email = input.email.trim().toLowerCase();
  }

  if (input.phone !== undefined) {
    updateData.phone = input.phone ? input.phone.trim() : null;
  }

  if (input.designation !== undefined) {
    updateData.designation = input.designation.trim() || 'Staff';
  }

  if (input.department !== undefined) {
    updateData.department = input.department.trim() || 'General Operations';
  }

  let basic = Number(existing.basicSalary);
  if (input.basicSalary !== undefined) {
    basic = Number(input.basicSalary);
    if (isNaN(basic) || basic < 0) throw new AppError('Valid Basic Salary required', 400);
    updateData.basicSalary = new Prisma.Decimal(basic);
  }

  let allowance = Number(existing.allowance);
  if (input.allowance !== undefined) {
    allowance = Number(input.allowance);
    if (isNaN(allowance) || allowance < 0) throw new AppError('Valid allowance required', 400);
    updateData.allowance = new Prisma.Decimal(allowance);
  }

  updateData.grossSalary = new Prisma.Decimal(basic + allowance);

  if (input.joinDate !== undefined) {
    updateData.joinDate = input.joinDate ? new Date(input.joinDate) : null;
  }

  if (input.status !== undefined) {
    updateData.status = input.status;
  }

  if (input.address !== undefined) {
    updateData.address = input.address ? input.address.trim() : null;
  }

  if (input.notes !== undefined) {
    updateData.notes = input.notes ? input.notes.trim() : null;
  }

  const updated = await prisma.employee.update({
    where: { id },
    data: updateData,
  });

  return formatEmployee(updated);
};

export const deleteEmployee = async (id: string): Promise<void> => {
  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Employee not found', 404);
  }

  await prisma.employee.delete({ where: { id } });
};

export const bulkDeleteEmployees = async (ids: string[]): Promise<number> => {
  if (!ids || ids.length === 0) return 0;
  const res = await prisma.employee.deleteMany({
    where: { id: { in: ids } },
  });
  return res.count;
};

export const exportEmployeesCsv = async (query: EmployeeFilterQuery): Promise<string> => {
  const where: Prisma.EmployeeWhereInput = {};

  if (query.status && query.status !== 'ALL') {
    where.status = query.status;
  }

  if (query.department && query.department.trim()) {
    where.department = query.department.trim();
  }

  if (query.search && query.search.trim()) {
    const s = query.search.trim();
    where.OR = [
      { employeeId: { contains: s } },
      { name: { contains: s } },
      { email: { contains: s } },
      { phone: { contains: s } },
      { designation: { contains: s } },
      { department: { contains: s } },
    ];
  }

  const items = await prisma.employee.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  const header = [
    'Employee ID',
    'Name',
    'Email',
    'Phone',
    'Designation',
    'Department',
    'Basic Salary (BDT)',
    'Mobile & Other Allowance (BDT)',
    'Gross Salary (BDT)',
    'Status',
    'Joining Date',
    'Address',
  ];

  const rows = items.map((r) => [
    `"${r.employeeId}"`,
    `"${r.name.replace(/"/g, '""')}"`,
    `"${r.email.replace(/"/g, '""')}"`,
    `"${(r.phone || '').replace(/"/g, '""')}"`,
    `"${r.designation.replace(/"/g, '""')}"`,
    `"${r.department.replace(/"/g, '""')}"`,
    Number(r.basicSalary).toFixed(2),
    Number(r.allowance).toFixed(2),
    Number(r.grossSalary).toFixed(2),
    r.status,
    r.joinDate ? r.joinDate.toISOString().split('T')[0] : '',
    `"${(r.address || '').replace(/"/g, '""')}"`,
  ]);

  return '\uFEFF' + [header.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
};

