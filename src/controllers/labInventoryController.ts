import { Request, Response, NextFunction } from 'express';
import { 
  getLabParts,
  getLabIns, 
  getLabInById, 
  createLabIn, 
  updateLabIn, 
  deleteLabIn, 
  bulkDeleteLabIns, 
  exportLabInsCsv,
  getLabOuts, 
  getLabOutById, 
  createLabOut, 
  updateLabOut, 
  deleteLabOut, 
  bulkDeleteLabOuts, 
  exportLabOutsCsv
} from '../services/labInventoryService';
import { ApiResponse } from '../types';

// ==========================================
// LAB PARTS CONTROLLERS
// ==========================================

export const getLabPartsHandler = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    const { search } = req.query;
    const data = await getLabParts(search as string | undefined);
    res.status(200).json({
      success: true,
      message: 'Lab parts retrieved successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// LAB IN CONTROLLERS
// ==========================================

export const getLabInsHandler = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    const data = await getLabIns(req.query);
    res.status(200).json({
      success: true,
      message: 'Lab In records retrieved successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getLabInByIdHandler = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    const data = await getLabInById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Lab In record retrieved successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const createLabInHandler = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    const data = await createLabIn(req.body, req.user?.id);
    res.status(201).json({
      success: true,
      message: 'Lab In record created successfully and stock updated',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updateLabInHandler = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    const data = await updateLabIn(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Lab In record updated successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLabInHandler = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    await deleteLabIn(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Lab In record deleted successfully and stock adjusted',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteLabInsHandler = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    const { ids } = req.body;
    const count = await bulkDeleteLabIns(ids);
    res.status(200).json({
      success: true,
      message: `${count} Lab In records deleted successfully`,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};

export const exportLabInsCsvHandler = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const csvData = await exportLabInsCsv(req.query);
    const filename = `lab-in-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvData);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// LAB OUT CONTROLLERS
// ==========================================

export const getLabOutsHandler = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    const data = await getLabOuts(req.query);
    res.status(200).json({
      success: true,
      message: 'Lab Out records retrieved successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getLabOutByIdHandler = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    const data = await getLabOutById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Lab Out record retrieved successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const createLabOutHandler = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    const data = await createLabOut(req.body, req.user?.id);
    res.status(201).json({
      success: true,
      message: 'Lab Out dispatch created successfully and stock decreased',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updateLabOutHandler = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    const data = await updateLabOut(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Lab Out record updated successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLabOutHandler = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    await deleteLabOut(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Lab Out record deleted successfully and stock restored',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteLabOutsHandler = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    const { ids } = req.body;
    const count = await bulkDeleteLabOuts(ids);
    res.status(200).json({
      success: true,
      message: `${count} Lab Out records deleted successfully`,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};

export const exportLabOutsCsvHandler = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const csvData = await exportLabOutsCsv(req.query);
    const filename = `lab-out-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvData);
  } catch (error) {
    next(error);
  }
};

