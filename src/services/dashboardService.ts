import { prisma } from '../config/prisma';

export interface DashboardStats {
  financials: {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
    incomeCount: number;
    expenseCount: number;
  };
  salary: {
    totalPayroll: number;
    totalPaid: number;
    totalDue: number;
    recordsCount: number;
  };
  employees: {
    totalCount: number;
    activeCount: number;
    totalMonthlyPayroll: number;
  };
  officeRent: {
    totalBilled: number;
    totalPaid: number;
    totalUnpaid: number;
    recordsCount: number;
  };
  taDa: {
    totalBills: number;
    totalAmount: number;
    pendingCount: number;
    approvedCount: number;
  };
  labInventory: {
    totalParts: number;
    totalStockQuantity: number;
    lowStockCount: number;
    totalInCount: number;
    totalOutCount: number;
  };
  bills: {
    corporateCount: number;
    corporateAmount: number;
    nonCorporateCount: number;
    nonCorporateAmount: number;
    totalCount: number;
    totalAmount: number;
  };
  requisitions: {
    totalCount: number;
    totalEstimatedAmount: number;
  };
  gatePasses: {
    totalCount: number;
    receivingCount: number;
    returnCount: number;
  };
  recentActivities: Array<{
    id: string;
    type: 'INCOME' | 'EXPENSE' | 'SALARY' | 'OFFICE_RENT' | 'BILL' | 'GATE_PASS';
    title: string;
    subtitle: string;
    amount?: number;
    status?: string;
    date: string;
  }>;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  // Run queries in parallel
  const [
    incomeAgg,
    expenseAgg,
    incomeCount,
    expenseCount,
    salaryAgg,
    salaryCount,
    employeesCount,
    activeEmployeesCount,
    employeeSalaryAgg,
    officeRentAgg,
    officeRentCount,
    taDaAgg,
    taDaCount,
    taDaPendingCount,
    taDaApprovedCount,
    labParts,
    labInCount,
    labOutCount,
    billVouchers,
    requisitions,
    gatePasses,
    recentIncomes,
    recentExpenses,
    recentSalaries,
  ] = await Promise.all([
    prisma.income.aggregate({ _sum: { amount: true } }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
    prisma.income.count(),
    prisma.expense.count(),
    prisma.salaryRecord.aggregate({
      _sum: { netPayable: true, paidAmount: true, dueAmount: true },
    }),
    prisma.salaryRecord.count(),
    prisma.employee.count(),
    prisma.employee.count({ where: { status: 'ACTIVE' } }),
    prisma.employee.aggregate({
      where: { status: 'ACTIVE' },
      _sum: { grossSalary: true },
    }),
    prisma.officeRent.aggregate({
      _sum: { amount: true },
    }),
    prisma.officeRent.count(),
    prisma.taDaBill.aggregate({ _sum: { totalAmount: true } }),
    prisma.taDaBill.count(),
    prisma.taDaBill.count({ where: { status: 'PENDING' } }),
    prisma.taDaBill.count({ where: { status: 'APPROVED' } }),
    prisma.labPart.findMany(),
    prisma.labIn.count(),
    prisma.labOut.count(),
    prisma.billVoucher.findMany({ select: { customerType: true, grandTotal: true } }),
    prisma.requisition.findMany({ select: { grandTotal: true } }),
    prisma.gatePass.findMany({ select: { challanKind: true } }),
    prisma.income.findMany({
      orderBy: { date: 'desc' },
      take: 4,
    }),
    prisma.expense.findMany({
      orderBy: { date: 'desc' },
      take: 4,
    }),
    prisma.salaryRecord.findMany({
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
  ]);

  const totalIncome = incomeAgg._sum.amount ? Number(incomeAgg._sum.amount) : 0;
  const totalExpense = expenseAgg._sum.amount ? Number(expenseAgg._sum.amount) : 0;
  const netBalance = totalIncome - totalExpense;

  // Rent paid vs unpaid
  const rentPaidAgg = await prisma.officeRent.aggregate({
    where: { status: 'PAID' },
    _sum: { amount: true },
  });
  const totalRentBilled = officeRentAgg._sum.amount ? Number(officeRentAgg._sum.amount) : 0;
  const totalRentPaid = rentPaidAgg?._sum?.amount ? Number(rentPaidAgg._sum.amount) : 0;
  const totalRentUnpaid = Math.max(0, totalRentBilled - totalRentPaid);

  // Lab parts summary
  let totalStockQuantity = 0;
  let lowStockCount = 0;
  labParts.forEach((p) => {
    const qty = Number(p.stockQuantity) || 0;
    totalStockQuantity += qty;
    if (qty <= 3) {
      lowStockCount++;
    }
  });

  // Bills summary
  let corporateCount = 0;
  let corporateAmount = 0;
  let nonCorporateCount = 0;
  let nonCorporateAmount = 0;
  billVouchers.forEach((b) => {
    const amt = Number(b.grandTotal) || 0;
    if (b.customerType === 'CORPORATE') {
      corporateCount++;
      corporateAmount += amt;
    } else {
      nonCorporateCount++;
      nonCorporateAmount += amt;
    }
  });

  // Requisitions
  let totalEstimatedAmount = 0;
  requisitions.forEach((r) => {
    totalEstimatedAmount += Number(r.grandTotal) || 0;
  });

  // Gate Passes
  let receivingCount = 0;
  let returnCount = 0;
  gatePasses.forEach((g) => {
    if (g.challanKind === 'RECEIVING') receivingCount++;
    else if (g.challanKind === 'RETURN') returnCount++;
  });

  // Combine recent activities
  const recentActivities: DashboardStats['recentActivities'] = [];

  recentIncomes.forEach((inc) => {
    recentActivities.push({
      id: inc.id,
      type: 'INCOME',
      title: inc.companyOrStoreName,
      subtitle: 'Income Received',
      amount: Number(inc.amount),
      status: inc.status,
      date: inc.date.toISOString().split('T')[0],
    });
  });

  recentExpenses.forEach((exp) => {
    recentActivities.push({
      id: exp.id,
      type: 'EXPENSE',
      title: exp.companyOrStoreName,
      subtitle: exp.category || 'General Expenditure',
      amount: Number(exp.amount),
      status: 'PAID',
      date: exp.date.toISOString().split('T')[0],
    });
  });

  recentSalaries.forEach((sal) => {
    recentActivities.push({
      id: sal.id,
      type: 'SALARY',
      title: `${sal.employeeName} (${sal.month})`,
      subtitle: `Payroll: ${sal.designation}`,
      amount: Number(sal.netPayable),
      status: sal.paymentStatus,
      date: sal.createdAt.toISOString().split('T')[0],
    });
  });

  // Sort activities by date descending
  recentActivities.sort((a, b) => (a.date < b.date ? 1 : -1));

  return {
    financials: {
      totalIncome,
      totalExpense,
      netBalance,
      incomeCount,
      expenseCount,
    },
    salary: {
      totalPayroll: salaryAgg._sum.netPayable ? Number(salaryAgg._sum.netPayable) : 0,
      totalPaid: salaryAgg._sum.paidAmount ? Number(salaryAgg._sum.paidAmount) : 0,
      totalDue: salaryAgg._sum.dueAmount ? Number(salaryAgg._sum.dueAmount) : 0,
      recordsCount: salaryCount,
    },
    employees: {
      totalCount: employeesCount,
      activeCount: activeEmployeesCount,
      totalMonthlyPayroll: employeeSalaryAgg._sum.grossSalary
        ? Number(employeeSalaryAgg._sum.grossSalary)
        : 0,
    },
    officeRent: {
      totalBilled: totalRentBilled,
      totalPaid: totalRentPaid,
      totalUnpaid: totalRentUnpaid,
      recordsCount: officeRentCount,
    },
    taDa: {
      totalBills: taDaCount,
      totalAmount: taDaAgg._sum.totalAmount ? Number(taDaAgg._sum.totalAmount) : 0,
      pendingCount: taDaPendingCount,
      approvedCount: taDaApprovedCount,
    },
    labInventory: {
      totalParts: labParts.length,
      totalStockQuantity,
      lowStockCount,
      totalInCount: labInCount,
      totalOutCount: labOutCount,
    },
    bills: {
      corporateCount,
      corporateAmount,
      nonCorporateCount,
      nonCorporateAmount,
      totalCount: billVouchers.length,
      totalAmount: corporateAmount + nonCorporateAmount,
    },
    requisitions: {
      totalCount: requisitions.length,
      totalEstimatedAmount,
    },
    gatePasses: {
      totalCount: gatePasses.length,
      receivingCount,
      returnCount,
    },
    recentActivities: recentActivities.slice(0, 8),
  };
};
