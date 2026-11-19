import { Request, Response, NextFunction } from 'express';
import { 
  getTaDaBills, 
  getTaDaBillById, 
  createTaDaBill, 
  updateTaDaBill, 
  deleteTaDaBill, 
  bulkDeleteTaDaBills, 
  exportTaDaCsv,
  generateNextTaDaBillNo
} from '../services/taDaService';
import { sendSuccess } from '../utils/response';
import { TaDaFilterQuery, TaDaStatus } from '../types';

export const getTaDaBillsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query: TaDaFilterQuery = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
      search: req.query.search as string,
      status: req.query.status as TaDaStatus,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      sortBy: req.query.sortBy as string,
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const result = await getTaDaBills(query);
    sendSuccess(res, 'TA/DA bills retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getNextTaDaBillNoHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const billNo = await generateNextTaDaBillNo();
    sendSuccess(res, 'Next TA/DA bill number generated', { billNo });
  } catch (error) {
    next(error);
  }
};

export const getTaDaBillByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const bill = await getTaDaBillById(id);
    sendSuccess(res, 'TA/DA bill retrieved successfully', bill);
  } catch (error) {
    next(error);
  }
};

export const createTaDaBillHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const created = await createTaDaBill(req.body, userId);
    sendSuccess(res, 'TA/DA bill created successfully', created, 201);
  } catch (error) {
    next(error);
  }
};

export const updateTaDaBillHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updated = await updateTaDaBill(id, req.body);
    sendSuccess(res, 'TA/DA bill updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const deleteTaDaBillHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await deleteTaDaBill(id);
    sendSuccess(res, 'TA/DA bill deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteTaDaBillsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { ids } = req.body;
    const count = await bulkDeleteTaDaBills(ids);
    sendSuccess(res, `${count} TA/DA bills deleted successfully`, { count });
  } catch (error) {
    next(error);
  }
};

export const exportTaDaCsvHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query: TaDaFilterQuery = {
      status: req.query.status as TaDaStatus,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    const csvData = await exportTaDaCsv(query);
    const filename = `tada-bills-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvData);
  } catch (error) {
    next(error);
  }
};

