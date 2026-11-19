import { Request, Response, NextFunction } from 'express';
import { 
  getOfficeRents, 
  getOfficeRentById, 
  createOfficeRent, 
  updateOfficeRent, 
  deleteOfficeRent, 
  bulkDeleteOfficeRents, 
  exportOfficeRentsCsv 
} from '../services/officeRentService';
import { ApiResponse } from '../types';

export const getOfficeRentsHandler = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    const data = await getOfficeRents(req.query);
    res.status(200).json({
      success: true,
      message: 'Office rent records retrieved successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getOfficeRentByIdHandler = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    const data = await getOfficeRentById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Office rent record retrieved successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const createOfficeRentHandler = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    const data = await createOfficeRent(req.body, req.user?.id);
    res.status(201).json({
      success: true,
      message: 'Office rent record created successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOfficeRentHandler = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    const data = await updateOfficeRent(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Office rent record updated successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteOfficeRentHandler = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    await deleteOfficeRent(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Office rent record deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteOfficeRentsHandler = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    const { ids } = req.body;
    const count = await bulkDeleteOfficeRents(ids);
    res.status(200).json({
      success: true,
      message: `${count} office rent records deleted successfully`,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};

export const exportOfficeRentsCsvHandler = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const csvData = await exportOfficeRentsCsv(req.query);
    const filename = `office-rent-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvData);
  } catch (error) {
    next(error);
  }
};

