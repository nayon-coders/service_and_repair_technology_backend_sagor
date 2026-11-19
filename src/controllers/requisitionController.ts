import { Request, Response, NextFunction } from 'express';
import { 
  getRequisitions, 
  getRequisitionById, 
  createRequisition, 
  updateRequisition, 
  deleteRequisition, 
  bulkDeleteRequisitions, 
  exportRequisitionsCsv,
  generateNextEstimateNo
} from '../services/requisitionService';
import { sendSuccess } from '../utils/response';
import { RequisitionFilterQuery, CustomerType, RequisitionStatus } from '../types';

export const getRequisitionsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query: RequisitionFilterQuery = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
      search: req.query.search as string,
      customerType: req.query.customerType as CustomerType,
      status: req.query.status as RequisitionStatus,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      sortBy: req.query.sortBy as string,
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const result = await getRequisitions(query);
    sendSuccess(res, 'Requisitions retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getNextEstimateNoHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const estimateNo = await generateNextEstimateNo();
    sendSuccess(res, 'Next estimate number generated', { estimateNo });
  } catch (error) {
    next(error);
  }
};

export const getRequisitionByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const requisition = await getRequisitionById(id);
    sendSuccess(res, 'Requisition retrieved successfully', requisition);
  } catch (error) {
    next(error);
  }
};

export const createRequisitionHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const created = await createRequisition(req.body, userId);
    sendSuccess(res, 'Requisition created successfully', created, 201);
  } catch (error) {
    next(error);
  }
};

export const updateRequisitionHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updated = await updateRequisition(id, req.body);
    sendSuccess(res, 'Requisition updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const deleteRequisitionHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await deleteRequisition(id);
    sendSuccess(res, 'Requisition deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteRequisitionsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { ids } = req.body;
    const count = await bulkDeleteRequisitions(ids);
    sendSuccess(res, `${count} requisitions deleted successfully`, { count });
  } catch (error) {
    next(error);
  }
};

export const exportRequisitionsCsvHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query: RequisitionFilterQuery = {
      customerType: req.query.customerType as CustomerType,
      status: req.query.status as RequisitionStatus,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    const csvData = await exportRequisitionsCsv(query);
    const filename = `requisitions-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvData);
  } catch (error) {
    next(error);
  }
};

