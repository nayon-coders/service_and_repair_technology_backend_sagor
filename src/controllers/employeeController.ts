import { Request, Response, NextFunction } from 'express';
import { 
  getEmployees, 
  getEmployeeById, 
  createEmployee, 
  updateEmployee, 
  deleteEmployee, 
  bulkDeleteEmployees, 
  exportEmployeesCsv,
  generateNextEmployeeId
} from '../services/employeeService';
import { ApiResponse } from '../types';

export const getEmployeesHandler = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    const data = await getEmployees(req.query);
    res.status(200).json({
      success: true,
      message: 'Employees retrieved successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getNextEmployeeIdHandler = async (
  _req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    const employeeId = await generateNextEmployeeId();
    res.status(200).json({
      success: true,
      message: 'Next employee ID generated',
      data: { employeeId },
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeByIdHandler = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    const data = await getEmployeeById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Employee retrieved successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const createEmployeeHandler = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    const data = await createEmployee(req.body, req.user?.id);
    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updateEmployeeHandler = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    const data = await updateEmployee(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEmployeeHandler = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    await deleteEmployee(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteEmployeesHandler = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
): Promise<void> => {
  try {
    const { ids } = req.body;
    const count = await bulkDeleteEmployees(ids);
    res.status(200).json({
      success: true,
      message: `${count} employees deleted successfully`,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};

export const exportEmployeesCsvHandler = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const csvData = await exportEmployeesCsv(req.query);
    const filename = `employees-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvData);
  } catch (error) {
    next(error);
  }
};

