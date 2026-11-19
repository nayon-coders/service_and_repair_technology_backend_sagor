import { prisma } from '../config/prisma';
import { BillVoucher, BillVoucherItem, Prisma, CustomerType, BillType, VoucherPaymentStatus, VoucherPaymentMethod } from '@prisma/client';
import { 
  CreateBillVoucherInput, 
  UpdateBillVoucherInput, 
  BillVoucherFilterQuery, 
  BillVoucherListResponse, 
  BillVoucherRecord
} from '../types';
import { AppError } from '../utils/appError';

// Convert number to English Words for Taka
export const numberToWordsTaka = (amount: number): string => {
  const rounded = Math.round(Math.abs(amount));
  if (rounded === 0) return 'Zero Taka Only';

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertThreeDigits = (num: number): string => {
    let out = '';
    const hundred = Math.floor(num / 100);
    const rest = num % 100;
    if (hundred > 0) {
      out += `${units[hundred]} Hundred `;
    }
    if (rest > 0) {
      if (rest < 10) {
        out += units[rest];
      } else if (rest < 20) {
        out += teens[rest - 10];
      } else {
        const tenDigit = Math.floor(rest / 10);
        const singleDigit = rest % 10;
        out += tens[tenDigit] + (singleDigit > 0 ? `-${units[singleDigit]}` : '');
      }
    }
    return out.trim();
  };

  // Indian/Bangladeshi numbering: Crores (10,000,000), Lakhs (100,000), Thousands (1,000), Rest (0-999)
  let num = rounded;
  const parts: string[] = [];

  const crores = Math.floor(num / 10000000);
  if (crores > 0) {
    parts.push(`${convertThreeDigits(crores)} Crore`);
    num %= 10000000;
  }

  const lakhs = Math.floor(num / 100000);
  if (lakhs > 0) {
    parts.push(`${convertThreeDigits(lakhs)} Lakh`);
    num %= 100000;
  }

  const thousands = Math.floor(num / 1000);
  if (thousands > 0) {
    parts.push(`${convertThreeDigits(thousands)} Thousand`);
    num %= 1000;
  }

  if (num > 0) {
    parts.push(convertThreeDigits(num));
  }

  return `${parts.join(' ')} Taka Only`;
};

// Auto generate next voucher number e.g. BV-2026-0001
export const generateNextVoucherNo = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const prefix = `BV-${currentYear}-`;

  const lastVoucher = await prisma.billVoucher.findFirst({
    where: { voucherNo: { startsWith: prefix } },
    orderBy: { voucherNo: 'desc' },
  });

  if (!lastVoucher) {
    return `${prefix}0001`;
  }

  const match = lastVoucher.voucherNo.match(/(\d+)$/);
  const nextNum = match ? parseInt(match[1], 10) + 1 : 1;
  return `${prefix}${String(nextNum).padStart(4, '0')}`;
};

// Format Prisma Record to DTO
const formatVoucher = (
  voucher: BillVoucher & { items?: BillVoucherItem[] }
): BillVoucherRecord => ({
  id: voucher.id,
  voucherNo: voucher.voucherNo,
  date: voucher.date instanceof Date ? voucher.date.toISOString().split('T')[0] : String(voucher.date),
  customerType: voucher.customerType as CustomerType,
  billType: voucher.billType as BillType,
  customerName: voucher.customerName,
  mobile: voucher.mobile,
  address: voucher.address,
  machineName: voucher.machineName,
  brandModel: voucher.brandModel,
  serialNo: voucher.serialNo,
  department: voucher.department,
  problemComplaint: voucher.problemComplaint,
  receivedDate: voucher.receivedDate instanceof Date ? voucher.receivedDate.toISOString().split('T')[0] : null,
  partsTotal: Number(voucher.partsTotal),
  serviceCharge: Number(voucher.serviceCharge),
  discount: Number(voucher.discount),
  grandTotal: Number(voucher.grandTotal),
  paidAmount: Number(voucher.paidAmount),
  dueAmount: Number(voucher.dueAmount),
  amountInWords: voucher.amountInWords || numberToWordsTaka(Number(voucher.grandTotal)),
  warrantyTerms: voucher.warrantyTerms,
  paymentStatus: voucher.paymentStatus as VoucherPaymentStatus,
  paymentMethod: voucher.paymentMethod as VoucherPaymentMethod,
  paymentMethodOther: voucher.paymentMethodOther,
  preparedBy: voucher.preparedBy,
  createdById: voucher.createdById,
  createdAt: voucher.createdAt,
  updatedAt: voucher.updatedAt,
  items: (voucher.items || []).map((item) => ({
    id: item.id,
    voucherId: item.voucherId,
    sl: item.sl,
    description: item.description,
    qty: Number(item.qty),
    unitPrice: Number(item.unitPrice),
    amount: Number(item.amount),
    remarks: item.remarks,
  })),
});

export const getVouchers = async (query: BillVoucherFilterQuery): Promise<BillVoucherListResponse> => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const where: Prisma.BillVoucherWhereInput = {};

  if (query.customerType) {
    where.customerType = query.customerType;
  }

  if (query.billType) {
    where.billType = query.billType;
  }

  if (query.paymentStatus && query.paymentStatus !== 'ALL') {
    where.paymentStatus = query.paymentStatus;
  }

  if (query.search && query.search.trim()) {
    const term = query.search.trim();
    where.OR = [
      { voucherNo: { contains: term } },
      { customerName: { contains: term } },
      { mobile: { contains: term } },
      { machineName: { contains: term } },
      { brandModel: { contains: term } },
      { serialNo: { contains: term } },
      { department: { contains: term } },
    ];
  }

  if (query.startDate || query.endDate) {
    where.date = {};
    if (query.startDate) where.date.gte = new Date(query.startDate);
    if (query.endDate) where.date.lte = new Date(query.endDate);
  }

  const orderBy: Prisma.BillVoucherOrderByWithRelationInput = {};
  if (query.sortBy) {
    const order = query.sortOrder === 'asc' ? 'asc' : 'desc';
    if (query.sortBy === 'voucherNo') orderBy.voucherNo = order;
    else if (query.sortBy === 'customerName') orderBy.customerName = order;
    else if (query.sortBy === 'grandTotal') orderBy.grandTotal = order;
    else if (query.sortBy === 'date') orderBy.date = order;
    else orderBy.date = 'desc';
  } else {
    orderBy.date = 'desc';
  }

  const [items, total, aggregates] = await Promise.all([
    prisma.billVoucher.findMany({
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
    prisma.billVoucher.count({ where }),
    prisma.billVoucher.aggregate({
      where,
      _sum: {
        grandTotal: true,
        paidAmount: true,
        dueAmount: true,
      },
    }),
  ]);

  return {
    items: items.map(formatVoucher),
    total,
    totalGrandAmount: Number(aggregates._sum.grandTotal || 0),
    totalPaidAmount: Number(aggregates._sum.paidAmount || 0),
    totalDueAmount: Number(aggregates._sum.dueAmount || 0),
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getVoucherById = async (id: string): Promise<BillVoucherRecord> => {
  const voucher = await prisma.billVoucher.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { sl: 'asc' },
      },
    },
  });

  if (!voucher) {
    throw new AppError('Bill voucher not found.', 404);
  }

  return formatVoucher(voucher);
};

export const createVoucher = async (
  input: CreateBillVoucherInput,
  userId?: string
): Promise<BillVoucherRecord> => {
  if (!input.customerName || !input.customerName.trim()) {
    throw new AppError('Customer / Institution name is required.', 400);
  }

  const voucherNo = input.voucherNo?.trim() || (await generateNextVoucherNo());

  // Check unique voucherNo
  const existing = await prisma.billVoucher.findUnique({
    where: { voucherNo },
  });
  if (existing) {
    throw new AppError(`Voucher number ${voucherNo} already exists.`, 400);
  }

  // Calculate items and partsTotal
  const rawItems = input.items && input.items.length > 0 ? input.items : [];
  let partsTotal = 0;
  const itemsData = rawItems.map((item, idx) => {
    const qty = Number(item.qty) || 1;
    const unitPrice = Number(item.unitPrice) || 0;
    const amount = item.amount !== undefined ? Number(item.amount) : qty * unitPrice;
    partsTotal += amount;
    return {
      sl: item.sl || idx + 1,
      description: item.description?.trim() || `Item ${idx + 1}`,
      qty,
      unitPrice,
      amount,
      remarks: item.remarks?.trim() || null,
    };
  });

  const serviceCharge = Number(input.serviceCharge) || 0;
  const discount = Number(input.discount) || 0;
  const grandTotal = Math.max(0, partsTotal + serviceCharge - discount);
  const paidAmount = Number(input.paidAmount) || 0;
  const dueAmount = Math.max(0, grandTotal - paidAmount);

  let paymentStatus: VoucherPaymentStatus = input.paymentStatus || 'DUE';
  if (!input.paymentStatus) {
    if (dueAmount <= 0 && grandTotal > 0) {
      paymentStatus = 'PAID';
    } else if (paidAmount > 0) {
      paymentStatus = 'PARTIAL';
    } else {
      paymentStatus = 'DUE';
    }
  }

  const amountInWords = input.amountInWords?.trim() || numberToWordsTaka(grandTotal);

  const created = await prisma.billVoucher.create({
    data: {
      voucherNo,
      date: new Date(input.date || Date.now()),
      customerType: input.customerType || 'CORPORATE',
      billType: input.billType || 'REPAIR',
      customerName: input.customerName.trim(),
      mobile: input.mobile?.trim() || null,
      address: input.address?.trim() || null,
      machineName: input.machineName?.trim() || null,
      brandModel: input.brandModel?.trim() || null,
      serialNo: input.serialNo?.trim() || null,
      department: input.department?.trim() || null,
      problemComplaint: input.problemComplaint?.trim() || null,
      receivedDate: input.receivedDate ? new Date(input.receivedDate) : null,
      partsTotal,
      serviceCharge,
      discount,
      grandTotal,
      paidAmount,
      dueAmount,
      amountInWords,
      warrantyTerms: input.warrantyTerms?.trim() || '1 year Panel Service Warranty',
      paymentStatus,
      paymentMethod: input.paymentMethod || 'CASH',
      paymentMethodOther: input.paymentMethodOther?.trim() || null,
      preparedBy: input.preparedBy?.trim() || null,
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

  return formatVoucher(created);
};

export const updateVoucher = async (
  id: string,
  input: UpdateBillVoucherInput
): Promise<BillVoucherRecord> => {
  const existing = await prisma.billVoucher.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!existing) {
    throw new AppError('Bill voucher not found.', 404);
  }

  if (input.voucherNo && input.voucherNo !== existing.voucherNo) {
    const duplicate = await prisma.billVoucher.findUnique({
      where: { voucherNo: input.voucherNo },
    });
    if (duplicate) {
      throw new AppError(`Voucher number ${input.voucherNo} already exists.`, 400);
    }
  }

  // Handle items recalculation if items provided
  let partsTotal = Number(existing.partsTotal);
  let itemsCreateOrReplace = false;
  let newItemsData: { sl: number; description: string; qty: number; unitPrice: number; amount: number; remarks: string | null }[] = [];

  if (input.items && Array.isArray(input.items)) {
    itemsCreateOrReplace = true;
    partsTotal = 0;
    newItemsData = input.items.map((item, idx) => {
      const qty = Number(item.qty) || 1;
      const unitPrice = Number(item.unitPrice) || 0;
      const amount = item.amount !== undefined ? Number(item.amount) : qty * unitPrice;
      partsTotal += amount;
      return {
        sl: item.sl || idx + 1,
        description: item.description?.trim() || `Item ${idx + 1}`,
        qty,
        unitPrice,
        amount,
        remarks: item.remarks?.trim() || null,
      };
    });
  }

  const serviceCharge = input.serviceCharge !== undefined ? Number(input.serviceCharge) : Number(existing.serviceCharge);
  const discount = input.discount !== undefined ? Number(input.discount) : Number(existing.discount);
  const grandTotal = Math.max(0, partsTotal + serviceCharge - discount);
  const paidAmount = input.paidAmount !== undefined ? Number(input.paidAmount) : Number(existing.paidAmount);
  const dueAmount = Math.max(0, grandTotal - paidAmount);

  let paymentStatus: VoucherPaymentStatus = input.paymentStatus || existing.paymentStatus as VoucherPaymentStatus;
  if (!input.paymentStatus) {
    if (dueAmount <= 0 && grandTotal > 0) {
      paymentStatus = 'PAID';
    } else if (paidAmount > 0) {
      paymentStatus = 'PARTIAL';
    } else {
      paymentStatus = 'DUE';
    }
  }

  const amountInWords = input.amountInWords || numberToWordsTaka(grandTotal);

  const updated = await prisma.$transaction(async (tx) => {
    if (itemsCreateOrReplace) {
      await tx.billVoucherItem.deleteMany({
        where: { voucherId: id },
      });
      await tx.billVoucherItem.createMany({
        data: newItemsData.map((d) => ({ ...d, voucherId: id })),
      });
    }

    return tx.billVoucher.update({
      where: { id },
      data: {
        voucherNo: input.voucherNo?.trim() || existing.voucherNo,
        date: input.date ? new Date(input.date) : existing.date,
        customerType: input.customerType || existing.customerType,
        billType: input.billType || existing.billType,
        customerName: input.customerName?.trim() || existing.customerName,
        mobile: input.mobile !== undefined ? input.mobile?.trim() || null : existing.mobile,
        address: input.address !== undefined ? input.address?.trim() || null : existing.address,
        machineName: input.machineName !== undefined ? input.machineName?.trim() || null : existing.machineName,
        brandModel: input.brandModel !== undefined ? input.brandModel?.trim() || null : existing.brandModel,
        serialNo: input.serialNo !== undefined ? input.serialNo?.trim() || null : existing.serialNo,
        department: input.department !== undefined ? input.department?.trim() || null : existing.department,
        problemComplaint: input.problemComplaint !== undefined ? input.problemComplaint?.trim() || null : existing.problemComplaint,
        receivedDate: input.receivedDate !== undefined ? (input.receivedDate ? new Date(input.receivedDate) : null) : existing.receivedDate,
        partsTotal,
        serviceCharge,
        discount,
        grandTotal,
        paidAmount,
        dueAmount,
        amountInWords,
        warrantyTerms: input.warrantyTerms !== undefined ? input.warrantyTerms?.trim() || null : existing.warrantyTerms,
        paymentStatus,
        paymentMethod: input.paymentMethod || existing.paymentMethod,
        paymentMethodOther: input.paymentMethodOther !== undefined ? input.paymentMethodOther?.trim() || null : existing.paymentMethodOther,
        preparedBy: input.preparedBy !== undefined ? input.preparedBy?.trim() || null : existing.preparedBy,
      },
      include: {
        items: {
          orderBy: { sl: 'asc' },
        },
      },
    });
  });

  return formatVoucher(updated);
};

export const deleteVoucher = async (id: string): Promise<void> => {
  const existing = await prisma.billVoucher.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Bill voucher not found.', 404);
  }
  await prisma.billVoucher.delete({ where: { id } });
};

export const bulkDeleteVouchers = async (ids: string[]): Promise<number> => {
  if (!ids || ids.length === 0) {
    throw new AppError('No voucher IDs provided for deletion.', 400);
  }
  const result = await prisma.billVoucher.deleteMany({
    where: { id: { in: ids } },
  });
  return result.count;
};

export const exportVouchersCsv = async (query: BillVoucherFilterQuery): Promise<string> => {
  const where: Prisma.BillVoucherWhereInput = {};
  if (query.customerType) where.customerType = query.customerType;
  if (query.billType) where.billType = query.billType;
  if (query.paymentStatus && query.paymentStatus !== 'ALL') where.paymentStatus = query.paymentStatus;
  if (query.startDate || query.endDate) {
    where.date = {};
    if (query.startDate) where.date.gte = new Date(query.startDate);
    if (query.endDate) where.date.lte = new Date(query.endDate);
  }

  const items = await prisma.billVoucher.findMany({
    where,
    orderBy: { date: 'desc' },
    include: { items: true },
  });

  const header = [
    'Voucher No',
    'Date',
    'Customer Type',
    'Bill Type',
    'Customer Name',
    'Mobile',
    'Machine Name',
    'Brand/Model',
    'Serial No',
    'Parts Total',
    'Service Charge',
    'Discount',
    'Grand Total',
    'Paid Amount',
    'Due Amount',
    'Payment Status',
    'Payment Method',
  ];

  const escapeCsv = (val: unknown): string => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = items.map((v) => [
    escapeCsv(v.voucherNo),
    escapeCsv(v.date instanceof Date ? v.date.toISOString().split('T')[0] : v.date),
    escapeCsv(v.customerType),
    escapeCsv(v.billType),
    escapeCsv(v.customerName),
    escapeCsv(v.mobile || ''),
    escapeCsv(v.machineName || ''),
    escapeCsv(v.brandModel || ''),
    escapeCsv(v.serialNo || ''),
    escapeCsv(Number(v.partsTotal)),
    escapeCsv(Number(v.serviceCharge)),
    escapeCsv(Number(v.discount)),
    escapeCsv(Number(v.grandTotal)),
    escapeCsv(Number(v.paidAmount)),
    escapeCsv(Number(v.dueAmount)),
    escapeCsv(v.paymentStatus),
    escapeCsv(v.paymentMethod),
  ]);

  return [header.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
};
