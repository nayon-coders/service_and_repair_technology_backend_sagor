import { Request, Response, NextFunction } from 'express';
import { 
  getSalaryRecords, 
  getSalaryRecordById, 
  createSalaryRecord, 
  updateSalaryRecord, 
  deleteSalaryRecord, 
  bulkDeleteSalaryRecords, 
  exportSalaryCsv 
} from '../services/salaryService';
import { ApiResponse } from '../types';

export const getSalaryRecordsHandler = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    const data = await getSalaryRecords(req.query);
    res.status(200).json({
      success: true,
      message: 'Salary records retrieved successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getSalaryRecordByIdHandler = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    const data = await getSalaryRecordById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Salary record retrieved successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const createSalaryRecordHandler = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    const data = await createSalaryRecord(req.body, req.user?.id);
    res.status(201).json({
      success: true,
      message: 'Salary record created successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSalaryRecordHandler = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    const data = await updateSalaryRecord(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Salary record updated successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSalaryRecordHandler = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    await deleteSalaryRecord(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Salary record deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteSalaryRecordsHandler = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    const { ids } = req.body;
    const count = await bulkDeleteSalaryRecords(ids);
    res.status(200).json({
      success: true,
      message: `${count} salary records deleted successfully`,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};

export const exportSalaryCsvHandler = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const csvData = await exportSalaryCsv(req.query);
    const filename = `salary-sheet-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvData);
  } catch (error) {
    next(error);
  }
};

