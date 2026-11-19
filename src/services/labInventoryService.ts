import { prisma } from '../config/prisma';
import { LabIn, LabOut, LabPart, Prisma } from '@prisma/client';
import { 
  LabPartRecord, 
  LabInRecord, 
  CreateLabInInput, 
  UpdateLabInInput, 
  LabInFilterQuery, 
  LabInListResponse, 
  LabOutRecord, 
  CreateLabOutInput, 
  UpdateLabOutInput, 
  LabOutFilterQuery, 
  LabOutListResponse 
} from '../types';
import { AppError } from '../utils/appError';

// Format helpers
export const formatLabPart = (p: LabPart): LabPartRecord => ({
  id: p.id,
  name: p.name,
  partNumber: p.partNumber,
  unit: p.unit,
  unitPrice: Number(p.unitPrice),
  stockQuantity: Number(p.stockQuantity),
  totalInQuantity: Number(p.totalInQuantity),
  totalOutQuantity: Number(p.totalOutQuantity),
  createdAt: p.createdAt.toISOString(),
  updatedAt: p.updatedAt.toISOString(),
});

export const formatLabIn = (i: LabIn & { part?: LabPart | null }): LabInRecord => ({
  id: i.id,
  date: i.date.toISOString().split('T')[0],
  partId: i.partId,
  partsName: i.partsName,
  quantity: Number(i.quantity),
  unitPrice: Number(i.unitPrice),
  totalPrice: Number(i.totalPrice),
  supplier: i.supplier,
  invoiceNo: i.invoiceNo,
  remarks: i.remarks,
  createdById: i.createdById,
  currentStock: i.part ? Number(i.part.stockQuantity) : undefined,
  createdAt: i.createdAt.toISOString(),
  updatedAt: i.updatedAt.toISOString(),
});

export const formatLabOut = (o: LabOut & { part?: LabPart | null }): LabOutRecord => ({
  id: o.id,
  date: o.date.toISOString().split('T')[0],
  partId: o.partId,
  partsName: o.partsName,
  quantity: Number(o.quantity),
  unitPrice: Number(o.unitPrice),
  totalPrice: Number(o.totalPrice),
  dispatchedTo: o.dispatchedTo,
  referenceNo: o.referenceNo,
  remarks: o.remarks,
  createdById: o.createdById,
  currentStock: o.part ? Number(o.part.stockQuantity) : undefined,
  createdAt: o.createdAt.toISOString(),
  updatedAt: o.updatedAt.toISOString(),
});

// ==========================================
// LAB PARTS (INVENTORY CATALOG)
// ==========================================

export const getLabParts = async (search?: string): Promise<LabPartRecord[]> => {
  const where: Prisma.LabPartWhereInput = {};
  if (search && search.trim()) {
    where.name = { contains: search.trim() };
  }

  const parts = await prisma.labPart.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  return parts.map(formatLabPart);
};

// ==========================================
// LAB IN (STOCK IN)
// ==========================================

export const getLabIns = async (query: LabInFilterQuery): Promise<LabInListResponse> => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const where: Prisma.LabInWhereInput = {};

  if (query.search && query.search.trim()) {
    const s = query.search.trim();
    where.OR = [
      { partsName: { contains: s } },
      { supplier: { contains: s } },
      { invoiceNo: { contains: s } },
      { remarks: { contains: s } },
    ];
  }

  if (query.startDate || query.endDate) {
    where.date = {};
    if (query.startDate) where.date.gte = new Date(query.startDate);
    if (query.endDate) where.date.lte = new Date(query.endDate);
  }

  const orderBy: Prisma.LabInOrderByWithRelationInput = {};
  const validSortCols = ['date', 'partsName', 'quantity', 'unitPrice', 'totalPrice', 'createdAt'];
  const sortCol = query.sortBy && validSortCols.includes(query.sortBy) ? query.sortBy : 'date';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
  orderBy[sortCol as keyof Prisma.LabInOrderByWithRelationInput] = sortOrder;

  const [items, total, allItems] = await Promise.all([
    prisma.labIn.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: { part: true },
    }),
    prisma.labIn.count({ where }),
    prisma.labIn.findMany({
      where,
      select: { quantity: true, totalPrice: true },
    }),
  ]);

  let totalQuantity = 0;
  let totalAmount = 0;
  for (const it of allItems) {
    totalQuantity += Number(it.quantity);
    totalAmount += Number(it.totalPrice);
  }

  return {
    items: items.map(formatLabIn),
    total,
    totalQuantity,
    totalAmount,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getLabInById = async (id: string): Promise<LabInRecord> => {
  const item = await prisma.labIn.findUnique({
    where: { id },
    include: { part: true },
  });

  if (!item) {
    throw new AppError('Lab In record not found', 404);
  }

  return formatLabIn(item);
};

export const createLabIn = async (
  input: CreateLabInInput,
  userId?: string
): Promise<LabInRecord> => {
  const trimmedName = input.partsName?.trim();
  if (!trimmedName) {
    throw new AppError('Parts Name is required', 400);
  }

  const qty = Number(input.quantity);
  if (isNaN(qty) || qty <= 0) {
    throw new AppError('Quantity must be greater than 0', 400);
  }

  const unitPrice = Number(input.unitPrice);
  if (isNaN(unitPrice) || unitPrice < 0) {
    throw new AppError('Per Parts Price must be valid and non-negative', 400);
  }

  const totalPrice = qty * unitPrice;
  const entryDate = input.date ? new Date(input.date) : new Date();

  return await prisma.$transaction(async (tx) => {
    // 1. Find or create the LabPart
    let part = await tx.labPart.findUnique({
      where: { name: trimmedName },
    });

    if (!part) {
      part = await tx.labPart.create({
        data: {
          name: trimmedName,
          unitPrice: new Prisma.Decimal(unitPrice),
          stockQuantity: new Prisma.Decimal(qty),
          totalInQuantity: new Prisma.Decimal(qty),
          totalOutQuantity: new Prisma.Decimal(0),
        },
      });
    } else {
      part = await tx.labPart.update({
        where: { id: part.id },
        data: {
          unitPrice: new Prisma.Decimal(unitPrice),
          stockQuantity: { increment: new Prisma.Decimal(qty) },
          totalInQuantity: { increment: new Prisma.Decimal(qty) },
        },
      });
    }

    // 2. Create the LabIn record
    const labIn = await tx.labIn.create({
      data: {
        date: entryDate,
        partId: part.id,
        partsName: part.name,
        quantity: new Prisma.Decimal(qty),
        unitPrice: new Prisma.Decimal(unitPrice),
        totalPrice: new Prisma.Decimal(totalPrice),
        supplier: input.supplier?.trim() || null,
        invoiceNo: input.invoiceNo?.trim() || null,
        remarks: input.remarks?.trim() || null,
        createdById: userId || null,
      },
      include: { part: true },
    });

    return formatLabIn(labIn);
  });
};

export const updateLabIn = async (
  id: string,
  input: UpdateLabInInput
): Promise<LabInRecord> => {
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.labIn.findUnique({
      where: { id },
      include: { part: true },
    });

    if (!existing) {
      throw new AppError('Lab In record not found', 404);
    }

    const oldQty = Number(existing.quantity);
    const newQty = input.quantity !== undefined ? Number(input.quantity) : oldQty;
    if (isNaN(newQty) || newQty <= 0) {
      throw new AppError('Quantity must be greater than 0', 400);
    }

    const oldUnitPrice = Number(existing.unitPrice);
    const newUnitPrice = input.unitPrice !== undefined ? Number(input.unitPrice) : oldUnitPrice;
    if (isNaN(newUnitPrice) || newUnitPrice < 0) {
      throw new AppError('Unit price must be non-negative', 400);
    }

    const qtyDiff = newQty - oldQty;

    // Check that reducing stock won't drop below 0 if already consumed
    const currentStock = Number(existing.part.stockQuantity);
    if (currentStock + qtyDiff < 0) {
      throw new AppError(
        `Cannot reduce quantity by ${Math.abs(qtyDiff)}. Current stock is ${currentStock}, which would become negative.`,
        400
      );
    }

    // Update Part stock
    const updatedPart = await tx.labPart.update({
      where: { id: existing.partId },
      data: {
        stockQuantity: { increment: new Prisma.Decimal(qtyDiff) },
        totalInQuantity: { increment: new Prisma.Decimal(qtyDiff) },
        unitPrice: new Prisma.Decimal(newUnitPrice),
      },
    });

    const newTotalPrice = newQty * newUnitPrice;

    const updated = await tx.labIn.update({
      where: { id },
      data: {
        date: input.date ? new Date(input.date) : existing.date,
        quantity: new Prisma.Decimal(newQty),
        unitPrice: new Prisma.Decimal(newUnitPrice),
        totalPrice: new Prisma.Decimal(newTotalPrice),
        supplier: input.supplier !== undefined ? (input.supplier?.trim() || null) : existing.supplier,
        invoiceNo: input.invoiceNo !== undefined ? (input.invoiceNo?.trim() || null) : existing.invoiceNo,
        remarks: input.remarks !== undefined ? (input.remarks?.trim() || null) : existing.remarks,
      },
      include: { part: true },
    });

    return formatLabIn({ ...updated, part: updatedPart });
  });
};

export const deleteLabIn = async (id: string): Promise<void> => {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.labIn.findUnique({
      where: { id },
      include: { part: true },
    });

    if (!existing) {
      throw new AppError('Lab In record not found', 404);
    }

    const qty = Number(existing.quantity);
    const currentStock = Number(existing.part.stockQuantity);

    if (currentStock - qty < 0) {
      throw new AppError(
        `Cannot delete this Lab In record because ${qty} parts were stocked, but only ${currentStock} remain in stock (parts have already been dispatched in Lab Out).`,
        400
      );
    }

    await tx.labPart.update({
      where: { id: existing.partId },
      data: {
        stockQuantity: { decrement: new Prisma.Decimal(qty) },
        totalInQuantity: { decrement: new Prisma.Decimal(qty) },
      },
    });

    await tx.labIn.delete({ where: { id } });
  });
};

export const bulkDeleteLabIns = async (ids: string[]): Promise<number> => {
  let count = 0;
  for (const id of ids) {
    await deleteLabIn(id);
    count++;
  }
  return count;
};

export const exportLabInsCsv = async (query: LabInFilterQuery): Promise<string> => {
  const where: Prisma.LabInWhereInput = {};
  if (query.search && query.search.trim()) {
    const s = query.search.trim();
    where.OR = [
      { partsName: { contains: s } },
      { supplier: { contains: s } },
      { invoiceNo: { contains: s } },
      { remarks: { contains: s } },
    ];
  }

  const items = await prisma.labIn.findMany({
    where,
    orderBy: { date: 'desc' },
    include: { part: true },
  });

  const header = ['Date', 'Parts Name', 'Quantity', 'Per Parts Price (BDT)', 'Total (BDT)', 'Available Stock', 'Supplier', 'Invoice No', 'Remarks'];
  const rows = items.map((r) => [
    r.date.toISOString().split('T')[0],
    `"${r.partsName.replace(/"/g, '""')}"`,
    Number(r.quantity),
    Number(r.unitPrice).toFixed(2),
    Number(r.totalPrice).toFixed(2),
    r.part ? Number(r.part.stockQuantity) : '',
    `"${(r.supplier || '').replace(/"/g, '""')}"`,
    `"${(r.invoiceNo || '').replace(/"/g, '""')}"`,
    `"${(r.remarks || '').replace(/"/g, '""')}"`,
  ]);

  return '\uFEFF' + [header.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
};

// ==========================================
// LAB OUT (STOCK OUT)
// ==========================================

export const getLabOuts = async (query: LabOutFilterQuery): Promise<LabOutListResponse> => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const where: Prisma.LabOutWhereInput = {};

  if (query.search && query.search.trim()) {
    const s = query.search.trim();
    where.OR = [
      { partsName: { contains: s } },
      { dispatchedTo: { contains: s } },
      { referenceNo: { contains: s } },
      { remarks: { contains: s } },
    ];
  }

  if (query.startDate || query.endDate) {
    where.date = {};
    if (query.startDate) where.date.gte = new Date(query.startDate);
    if (query.endDate) where.date.lte = new Date(query.endDate);
  }

  const orderBy: Prisma.LabOutOrderByWithRelationInput = {};
  const validSortCols = ['date', 'partsName', 'quantity', 'unitPrice', 'totalPrice', 'createdAt'];
  const sortCol = query.sortBy && validSortCols.includes(query.sortBy) ? query.sortBy : 'date';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
  orderBy[sortCol as keyof Prisma.LabOutOrderByWithRelationInput] = sortOrder;

  const [items, total, allItems] = await Promise.all([
    prisma.labOut.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: { part: true },
    }),
    prisma.labOut.count({ where }),
    prisma.labOut.findMany({
      where,
      select: { quantity: true, totalPrice: true },
    }),
  ]);

  let totalQuantity = 0;
  let totalAmount = 0;
  for (const it of allItems) {
    totalQuantity += Number(it.quantity);
    totalAmount += Number(it.totalPrice);
  }

  return {
    items: items.map(formatLabOut),
    total,
    totalQuantity,
    totalAmount,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getLabOutById = async (id: string): Promise<LabOutRecord> => {
  const item = await prisma.labOut.findUnique({
    where: { id },
    include: { part: true },
  });

  if (!item) {
    throw new AppError('Lab Out record not found', 404);
  }

  return formatLabOut(item);
};

export const createLabOut = async (
  input: CreateLabOutInput,
  userId?: string
): Promise<LabOutRecord> => {
  if (!input.partId) {
    throw new AppError('Please select a Part from the lab inventory', 400);
  }

  const qty = Number(input.quantity);
  if (isNaN(qty) || qty <= 0) {
    throw new AppError('Quantity must be greater than 0', 400);
  }

  const outDate = input.date ? new Date(input.date) : new Date();

  return await prisma.$transaction(async (tx) => {
    // 1. Fetch Part and verify stock
    const part = await tx.labPart.findUnique({
      where: { id: input.partId },
    });

    if (!part) {
      throw new AppError('Selected part does not exist in lab inventory', 404);
    }

    const availableStock = Number(part.stockQuantity);
    if (qty > availableStock) {
      throw new AppError(
        `Insufficient stock! Available in lab: ${availableStock} ${part.unit}, but requested: ${qty} ${part.unit}.`,
        400
      );
    }

    const unitPrice = input.unitPrice !== undefined && Number(input.unitPrice) >= 0 
      ? Number(input.unitPrice) 
      : Number(part.unitPrice);

    const totalPrice = qty * unitPrice;

    // 2. Decrement Part stockQuantity
    const updatedPart = await tx.labPart.update({
      where: { id: part.id },
      data: {
        stockQuantity: { decrement: new Prisma.Decimal(qty) },
        totalOutQuantity: { increment: new Prisma.Decimal(qty) },
      },
    });

    // 3. Create LabOut record
    const labOut = await tx.labOut.create({
      data: {
        date: outDate,
        partId: part.id,
        partsName: part.name,
        quantity: new Prisma.Decimal(qty),
        unitPrice: new Prisma.Decimal(unitPrice),
        totalPrice: new Prisma.Decimal(totalPrice),
        dispatchedTo: input.dispatchedTo?.trim() || null,
        referenceNo: input.referenceNo?.trim() || null,
        remarks: input.remarks?.trim() || null,
        createdById: userId || null,
      },
      include: { part: true },
    });

    return formatLabOut({ ...labOut, part: updatedPart });
  });
};

export const updateLabOut = async (
  id: string,
  input: UpdateLabOutInput
): Promise<LabOutRecord> => {
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.labOut.findUnique({
      where: { id },
      include: { part: true },
    });

    if (!existing) {
      throw new AppError('Lab Out record not found', 404);
    }

    const oldQty = Number(existing.quantity);
    const newQty = input.quantity !== undefined ? Number(input.quantity) : oldQty;
    if (isNaN(newQty) || newQty <= 0) {
      throw new AppError('Quantity must be greater than 0', 400);
    }

    const oldUnitPrice = Number(existing.unitPrice);
    const newUnitPrice = input.unitPrice !== undefined ? Number(input.unitPrice) : oldUnitPrice;
    if (isNaN(newUnitPrice) || newUnitPrice < 0) {
      throw new AppError('Unit price must be non-negative', 400);
    }

    const qtyDiff = newQty - oldQty; // if increasing out, stock decreases further

    const currentStock = Number(existing.part.stockQuantity);
    if (currentStock - qtyDiff < 0) {
      throw new AppError(
        `Insufficient stock! Available in lab: ${currentStock}, need additional: ${qtyDiff}.`,
        400
      );
    }

    // Update Part stock
    const updatedPart = await tx.labPart.update({
      where: { id: existing.partId },
      data: {
        stockQuantity: { decrement: new Prisma.Decimal(qtyDiff) },
        totalOutQuantity: { increment: new Prisma.Decimal(qtyDiff) },
      },
    });

    const newTotalPrice = newQty * newUnitPrice;

    const updated = await tx.labOut.update({
      where: { id },
      data: {
        date: input.date ? new Date(input.date) : existing.date,
        quantity: new Prisma.Decimal(newQty),
        unitPrice: new Prisma.Decimal(newUnitPrice),
        totalPrice: new Prisma.Decimal(newTotalPrice),
        dispatchedTo: input.dispatchedTo !== undefined ? (input.dispatchedTo?.trim() || null) : existing.dispatchedTo,
        referenceNo: input.referenceNo !== undefined ? (input.referenceNo?.trim() || null) : existing.referenceNo,
        remarks: input.remarks !== undefined ? (input.remarks?.trim() || null) : existing.remarks,
      },
      include: { part: true },
    });

    return formatLabOut({ ...updated, part: updatedPart });
  });
};

export const deleteLabOut = async (id: string): Promise<void> => {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.labOut.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Lab Out record not found', 404);
    }

    const qty = Number(existing.quantity);

    // Add back to available stock
    await tx.labPart.update({
      where: { id: existing.partId },
      data: {
        stockQuantity: { increment: new Prisma.Decimal(qty) },
        totalOutQuantity: { decrement: new Prisma.Decimal(qty) },
      },
    });

    await tx.labOut.delete({ where: { id } });
  });
};

export const bulkDeleteLabOuts = async (ids: string[]): Promise<number> => {
  let count = 0;
  for (const id of ids) {
    await deleteLabOut(id);
    count++;
  }
  return count;
};

export const exportLabOutsCsv = async (query: LabOutFilterQuery): Promise<string> => {
  const where: Prisma.LabOutWhereInput = {};
  if (query.search && query.search.trim()) {
    const s = query.search.trim();
    where.OR = [
      { partsName: { contains: s } },
      { dispatchedTo: { contains: s } },
      { referenceNo: { contains: s } },
      { remarks: { contains: s } },
    ];
  }

  const items = await prisma.labOut.findMany({
    where,
    orderBy: { date: 'desc' },
    include: { part: true },
  });

  const header = ['Date', 'Parts Name', 'Quantity Dispatched', 'Per Parts Price (BDT)', 'Total (BDT)', 'Remaining Stock', 'Dispatched To', 'Ref / Machine', 'Remarks'];
  const rows = items.map((r) => [
    r.date.toISOString().split('T')[0],
    `"${r.partsName.replace(/"/g, '""')}"`,
    Number(r.quantity),
    Number(r.unitPrice).toFixed(2),
    Number(r.totalPrice).toFixed(2),
    r.part ? Number(r.part.stockQuantity) : '',
    `"${(r.dispatchedTo || '').replace(/"/g, '""')}"`,
    `"${(r.referenceNo || '').replace(/"/g, '""')}"`,
    `"${(r.remarks || '').replace(/"/g, '""')}"`,
  ]);

  return '\uFEFF' + [header.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
};

