import { Request, Response, NextFunction } from 'express';
import { 
  getExpenses, 
  getExpenseById, 
  createExpense, 
  updateExpense, 
  deleteExpense, 
  bulkDeleteExpenses, 
  importExpensesFromBuffer 
} from '../services/expenseService';
import { PaymentStatus } from '../types';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/appError';
import * as XLSX from 'xlsx';

export const getExpensesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit, search, status, category, startDate, endDate, sortBy, sortOrder } = req.query;
    const result = await getExpenses({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search: search ? String(search) : undefined,
      status: status ? (String(status) as PaymentStatus | 'ALL') : undefined,
      category: category ? String(category) : undefined,
      startDate: startDate ? String(startDate) : undefined,
      endDate: endDate ? String(endDate) : undefined,
      sortBy: sortBy ? String(sortBy) : undefined,
      sortOrder: sortOrder ? (String(sortOrder) as 'asc' | 'desc') : undefined,
    });

    sendSuccess(res, 'Expenses retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getExpenseByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await getExpenseById(id);
    sendSuccess(res, 'Expense record retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const createExpenseHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const result = await createExpense(req.body, userId);
    sendSuccess(res, 'Expense record created successfully', result, 201);
  } catch (error) {
    next(error);
  }
};

export const updateExpenseHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await updateExpense(id, req.body);
    sendSuccess(res, 'Expense record updated successfully', result);
  } catch (error) {
    next(error);
  }
};

export const deleteExpenseHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await deleteExpense(id);
    sendSuccess(res, 'Expense record deleted successfully', { id });
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteExpensesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { ids } = req.body;
    const count = await bulkDeleteExpenses(ids);
    sendSuccess(res, `${count} expense records deleted successfully`, { count });
  } catch (error) {
    next(error);
  }
};

export const importExpensesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file || !req.file.buffer) {
      throw new AppError('Please upload an Excel (.xlsx, .xls) or CSV file.', 400);
    }

    const userId = req.user?.id;
    const result = await importExpensesFromBuffer(req.file.buffer, userId);
    sendSuccess(res, `Successfully imported ${result.count} expense records`, result, 201);
  } catch (error) {
    next(error);
  }
};

export const exportExpensesCsvHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ids = req.query.ids ? String(req.query.ids).split(',').filter(Boolean) : [];
    
    let items;
    if (ids.length > 0) {
      const data = await getExpenses({ limit: 1000 });
      items = data.items.filter((item) => ids.includes(item.id));
    } else {
      const { search, status, category, startDate, endDate } = req.query;
      const data = await getExpenses({
        limit: 10000,
        search: search ? String(search) : undefined,
        status: status ? (String(status) as PaymentStatus | 'ALL') : undefined,
        category: category ? String(category) : undefined,
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
      });
      items = data.items;
    }

    // Format rows for CSV / Excel matching the user's columns
    const exportRows = items.map((item, index) => ({
      'SN': index + 1,
      'Date': item.date,
      'Company or store name': item.companyOrStoreName,
      'Total cost': item.amount,
      'Status': item.status,
      'Category': item.category || '',
      'Remarks': item.remarks || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="expense_report.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

