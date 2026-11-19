import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function exportAll() {
  console.log('Exporting MySQL data...');
  const data = {
    users: await prisma.user.findMany(),
    roles: await prisma.role.findMany(),
    permissions: await prisma.permission.findMany(),
    rolePermissions: await prisma.rolePermission.findMany(),
    navigationMenus: await prisma.navigationMenu.findMany(),
    systemSettings: await prisma.systemSetting.findMany(),
    employees: await prisma.employee.findMany(),
    salaryRecords: await prisma.salaryRecord.findMany(),
    billVouchers: await prisma.billVoucher.findMany({ include: { items: true } }),
    requisitions: await prisma.requisition.findMany({ include: { items: true } }),
    gatePasses: await prisma.gatePass.findMany({ include: { items: true } }),
    incomes: await prisma.income.findMany(),
    expenses: await prisma.expense.findMany(),
    officeRents: await prisma.officeRent.findMany(),
    taDaBills: await prisma.taDaBill.findMany({ include: { items: true } }),
    labParts: await prisma.labPart.findMany(),
    labIns: await prisma.labIn.findMany(),
    labOuts: await prisma.labOut.findMany(),
  };

  const outputPath = path.resolve(__dirname, '../../database_backup.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Successfully exported data to ${outputPath}`);
}

exportAll()
  .catch((err) => {
    console.error('Export failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
