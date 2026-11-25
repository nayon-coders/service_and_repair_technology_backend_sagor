import { Router } from 'express';
import healthRoutes from './healthRoutes';
import authRoutes from './authRoutes';
import navigationRoutes from './navigationRoutes';
import adminRoutes from './adminRoutes';
import dashboardRoutes from './dashboardRoutes';
import incomeRoutes from './incomeRoutes';
import expenseRoutes from './expenseRoutes';
import taDaRoutes from './taDaRoutes';
import officeRentRoutes from './officeRentRoutes';
import salaryRoutes from './salaryRoutes';
import labInventoryRoutes from './labInventoryRoutes';
import employeeRoutes from './employeeRoutes';
import voucherRoutes from './voucherRoutes';
import requisitionRoutes from './requisitionRoutes';
import gatePassRoutes from './gatePassRoutes';
import licenseRoutes from './licenseRoutes';
import templateRoutes from './templateRoutes';

const router = Router();

// License control endpoints
router.use('/license', licenseRoutes);

// Health check endpoint
router.use('/health', healthRoutes);

// Authentication endpoints
router.use('/auth', authRoutes);

// Dashboard statistics
router.use('/dashboard', dashboardRoutes);

// Dynamic hierarchical navigation endpoint
router.use('/navigation', navigationRoutes);

// Administrative role & permission endpoints
router.use('/admin', adminRoutes);

// Management: Income, Expense, Salary, TA/DA & Office Rent endpoints
router.use('/management/income', incomeRoutes);
router.use('/management/expense', expenseRoutes);
router.use('/management/salary', salaryRoutes);
router.use('/management/ta-da', taDaRoutes);
router.use('/management/office-rent', officeRentRoutes);

// Service: Lab In & Lab Out Inventory endpoints
router.use('/service/lab', labInventoryRoutes);

// Employee Management endpoints
router.use('/employees', employeeRoutes);

// Customer: Bill Vouchers, Requisitions & Gate Passes
router.use('/billing/vouchers', voucherRoutes);
router.use('/billing/requisitions', requisitionRoutes);
router.use('/billing/gate-passes', gatePassRoutes);

// System Settings & Problem Templates endpoints
router.use('/settings/templates', templateRoutes);

export default router;
