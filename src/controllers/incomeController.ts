import { Request, Response, NextFunction } from 'express';
import { 
  getIncomes, 
  getIncomeById, 
  createIncome, 
  updateIncome, 
  deleteIncome, 
  bulkDeleteIncomes, 
  importIncomesFromBuffer 
} from '../services/incomeService';
import { PaymentStatus } from '../types';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/appError';
import * as XLSX from 'xlsx';

export const getIncomesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit, search, status, startDate, endDate, sortBy, sortOrder } = req.query;
    const result = await getIncomes({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search: search ? String(search) : undefined,
      status: status ? (String(status) as PaymentStatus | 'ALL') : undefined,
      startDate: startDate ? String(startDate) : undefined,
      endDate: endDate ? String(endDate) : undefined,
      sortBy: sortBy ? String(sortBy) : undefined,
      sortOrder: sortOrder ? (String(sortOrder) as 'asc' | 'desc') : undefined,
    });

    sendSuccess(res, 'Incomes retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getIncomeByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await getIncomeById(id);
    sendSuccess(res, 'Income record retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const createIncomeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const result = await createIncome(req.body, userId);
    sendSuccess(res, 'Income record created successfully', result, 201);
  } catch (error) {
    next(error);
  }
};

export const updateIncomeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await updateIncome(id, req.body);
    sendSuccess(res, 'Income record updated successfully', result);
  } catch (error) {
    next(error);
  }
};

export const deleteIncomeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await deleteIncome(id);
    sendSuccess(res, 'Income record deleted successfully', { id });
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteIncomesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { ids } = req.body;
    const count = await bulkDeleteIncomes(ids);
    sendSuccess(res, `${count} income records deleted successfully`, { count });
  } catch (error) {
    next(error);
  }
};

export const importIncomesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file || !req.file.buffer) {
      throw new AppError('Please upload an Excel (.xlsx, .xls) or CSV file.', 400);
    }

    const userId = req.user?.id;
    const result = await importIncomesFromBuffer(req.file.buffer, userId);
    sendSuccess(res, `Successfully imported ${result.count} income records`, result, 201);
  } catch (error) {
    next(error);
  }
};

export const exportIncomesCsvHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // If specific IDs requested
    const ids = req.query.ids ? String(req.query.ids).split(',').filter(Boolean) : [];
    
    let items;
    if (ids.length > 0) {
      const data = await getIncomes({ limit: 1000 });
      items = data.items.filter((item) => ids.includes(item.id));
    } else {
      const { search, status, startDate, endDate } = req.query;
      const data = await getIncomes({
        limit: 10000,
        search: search ? String(search) : undefined,
        status: status ? (String(status) as PaymentStatus | 'ALL') : undefined,
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
      });
      items = data.items;
    }

    // Format rows for CSV / Excel
    const exportRows = items.map((item, index) => ({
      'SN': index + 1,
      'Date': item.date,
      'Company or store name': item.companyOrStoreName,
      'Total Income': item.amount,
      'Status': item.status,
      'Remarks': item.remarks || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="income_report.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
