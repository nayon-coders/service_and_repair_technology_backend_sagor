import { Request, Response, NextFunction } from 'express';
import { 
  getVouchers, 
  getVoucherById, 
  createVoucher, 
  updateVoucher, 
  deleteVoucher, 
  bulkDeleteVouchers, 
  exportVouchersCsv,
  generateNextVoucherNo
} from '../services/voucherService';
import { sendSuccess } from '../utils/response';
import { BillVoucherFilterQuery, CustomerType, BillType, VoucherPaymentStatus } from '../types';

export const getVouchersHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query: BillVoucherFilterQuery = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
      search: req.query.search as string,
      customerType: req.query.customerType as CustomerType,
      billType: req.query.billType as BillType,
      paymentStatus: req.query.paymentStatus as VoucherPaymentStatus,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      sortBy: req.query.sortBy as string,
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const result = await getVouchers(query);
    sendSuccess(res, 'Bill vouchers retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getNextVoucherNoHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const nextNo = await generateNextVoucherNo();
    sendSuccess(res, 'Next voucher number generated', { voucherNo: nextNo });
  } catch (error) {
    next(error);
  }
};

export const getVoucherByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const voucher = await getVoucherById(id);
    sendSuccess(res, 'Bill voucher retrieved successfully', voucher);
  } catch (error) {
    next(error);
  }
};

export const createVoucherHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const created = await createVoucher(req.body, userId);
    sendSuccess(res, 'Bill voucher created successfully', created, 201);
  } catch (error) {
    next(error);
  }
};

export const updateVoucherHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updated = await updateVoucher(id, req.body);
    sendSuccess(res, 'Bill voucher updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const deleteVoucherHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await deleteVoucher(id);
    sendSuccess(res, 'Bill voucher deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteVouchersHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { ids } = req.body;
    const count = await bulkDeleteVouchers(ids);
    sendSuccess(res, `${count} bill vouchers deleted successfully`, { count });
  } catch (error) {
    next(error);
  }
};

export const exportVouchersCsvHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query: BillVoucherFilterQuery = {
      customerType: req.query.customerType as CustomerType,
      billType: req.query.billType as BillType,
      paymentStatus: req.query.paymentStatus as VoucherPaymentStatus,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    const csvData = await exportVouchersCsv(query);
    const filename = `bill-vouchers-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvData);
  } catch (error) {
    next(error);
  }
};
