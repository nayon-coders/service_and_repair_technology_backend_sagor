import { Request, Response, NextFunction } from 'express';
import { 
  getGatePasses, 
  getGatePassById, 
  createGatePass, 
  updateGatePass, 
  deleteGatePass, 
  bulkDeleteGatePasses, 
  exportGatePassesCsv,
  generateNextGatePassNo
} from '../services/gatePassService';
import { sendSuccess } from '../utils/response';
import { GatePassFilterQuery, CustomerType, GatePassStatus, GatePassType, ChallanKind } from '../types';

export const getGatePassesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query: GatePassFilterQuery = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
      search: req.query.search as string,
      customerType: req.query.customerType as CustomerType,
      passType: req.query.passType as GatePassType,
      challanKind: req.query.challanKind as ChallanKind,
      status: req.query.status as GatePassStatus,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      sortBy: req.query.sortBy as string,
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const result = await getGatePasses(query);
    sendSuccess(res, 'Gate passes retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getNextGatePassNoHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const passNo = await generateNextGatePassNo();
    sendSuccess(res, 'Next gate pass number generated', { passNo });
  } catch (error) {
    next(error);
  }
};

export const getGatePassByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const gatePass = await getGatePassById(id);
    sendSuccess(res, 'Gate pass retrieved successfully', gatePass);
  } catch (error) {
    next(error);
  }
};

export const createGatePassHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const created = await createGatePass(req.body, userId);
    sendSuccess(res, 'Gate pass created successfully', created, 201);
  } catch (error) {
    next(error);
  }
};

export const updateGatePassHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updated = await updateGatePass(id, req.body);
    sendSuccess(res, 'Gate pass updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const deleteGatePassHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await deleteGatePass(id);
    sendSuccess(res, 'Gate pass deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteGatePassesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { ids } = req.body;
    const count = await bulkDeleteGatePasses(ids);
    sendSuccess(res, `${count} gate passes deleted successfully`, { count });
  } catch (error) {
    next(error);
  }
};

export const exportGatePassesCsvHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query: GatePassFilterQuery = {
      customerType: req.query.customerType as CustomerType,
      passType: req.query.passType as GatePassType,
      challanKind: req.query.challanKind as ChallanKind,
      status: req.query.status as GatePassStatus,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    const csvData = await exportGatePassesCsv(query);
    const filename = `gate-passes-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvData);
  } catch (error) {
    next(error);
  }
};

