import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function restoreAll() {
  const backupPath = path.resolve(__dirname, '../../database_backup.json');
  if (!fs.existsSync(backupPath)) {
    console.error('Backup file not found at:', backupPath);
    return;
  }

  const raw = fs.readFileSync(backupPath, 'utf8');
  const data = JSON.parse(raw);

  console.log('Restoring data into SQLite...');

  // 1. Roles
  for (const item of data.roles || []) {
    await prisma.role.upsert({
      where: { id: item.id },
      create: item,
      update: item,
    });
  }
  console.log(`✓ Restored ${data.roles?.length || 0} roles`);

  // 2. Users
  for (const item of data.users || []) {
    await prisma.user.upsert({
      where: { id: item.id },
      create: item,
      update: item,
    });
  }
  console.log(`✓ Restored ${data.users?.length || 0} users`);

  // 3. Permissions
  for (const item of data.permissions || []) {
    await prisma.permission.upsert({
      where: { id: item.id },
      create: item,
      update: item,
    });
  }
  console.log(`✓ Restored ${data.permissions?.length || 0} permissions`);

  // 4. Role Permissions
  for (const item of data.rolePermissions || []) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: item.roleId, permissionId: item.permissionId } },
      create: item,
      update: item,
    });
  }
  console.log(`✓ Restored ${data.rolePermissions?.length || 0} role permissions`);

  // 5. Navigation Menus
  for (const item of data.navigationMenus || []) {
    await prisma.navigationMenu.upsert({
      where: { id: item.id },
      create: item,
      update: item,
    });
  }
  console.log(`✓ Restored ${data.navigationMenus?.length || 0} navigation menus`);

  // 6. System Settings
  for (const item of data.systemSettings || []) {
    await prisma.systemSetting.upsert({
      where: { key: item.key },
      create: item,
      update: item,
    });
  }
  console.log(`✓ Restored ${data.systemSettings?.length || 0} system settings`);

  // 7. Employees
  for (const item of data.employees || []) {
    await prisma.employee.upsert({
      where: { id: item.id },
      create: item,
      update: item,
    });
  }
  console.log(`✓ Restored ${data.employees?.length || 0} employees`);

  // 8. Salary Records
  for (const item of data.salaryRecords || []) {
    await prisma.salaryRecord.upsert({
      where: { id: item.id },
      create: item,
      update: item,
    });
  }
  console.log(`✓ Restored ${data.salaryRecords?.length || 0} salary records`);

  // 9. Bill Vouchers & Items
  for (const item of data.billVouchers || []) {
    const { items, ...voucher } = item;
    const cleanItems = (items || []).map(({ voucherId, ...rest }: any) => rest);
    await prisma.billVoucher.upsert({
      where: { id: voucher.id },
      create: {
        ...voucher,
        items: {
          create: cleanItems,
        },
      },
      update: voucher,
    });
  }
  console.log(`✓ Restored ${data.billVouchers?.length || 0} bill vouchers`);

  // 10. Requisitions & Items
  for (const item of data.requisitions || []) {
    const { items, ...req } = item;
    const cleanItems = (items || []).map(({ requisitionId, ...rest }: any) => rest);
    await prisma.requisition.upsert({
      where: { id: req.id },
      create: {
        ...req,
        items: {
          create: cleanItems,
        },
      },
      update: req,
    });
  }
  console.log(`✓ Restored ${data.requisitions?.length || 0} requisitions`);

  // 11. Gate Passes & Items
  for (const item of data.gatePasses || []) {
    const { items, ...gp } = item;
    const cleanItems = (items || []).map(({ gatePassId, ...rest }: any) => rest);
    await prisma.gatePass.upsert({
      where: { id: gp.id },
      create: {
        ...gp,
        items: {
          create: cleanItems,
        },
      },
      update: gp,
    });
  }
  console.log(`✓ Restored ${data.gatePasses?.length || 0} gate passes`);

  // 12. Incomes
  for (const item of data.incomes || []) {
    await prisma.income.upsert({
      where: { id: item.id },
      create: item,
      update: item,
    });
  }
  console.log(`✓ Restored ${data.incomes?.length || 0} incomes`);

  // 13. Expenses
  for (const item of data.expenses || []) {
    await prisma.expense.upsert({
      where: { id: item.id },
      create: item,
      update: item,
    });
  }
  console.log(`✓ Restored ${data.expenses?.length || 0} expenses`);

  // 14. Office Rents
  for (const item of data.officeRents || []) {
    await prisma.officeRent.upsert({
      where: { id: item.id },
      create: item,
      update: item,
    });
  }
  console.log(`✓ Restored ${data.officeRents?.length || 0} office rents`);

  // 15. TA/DA Bills & Items
  for (const item of data.taDaBills || []) {
    const { items, ...tada } = item;
    const cleanItems = (items || []).map(({ taDaBillId, tadaBillId, ...rest }: any) => rest);
    await prisma.taDaBill.upsert({
      where: { id: tada.id },
      create: {
        ...tada,
        items: {
          create: cleanItems,
        },
      },
      update: tada,
    });
  }
  console.log(`✓ Restored ${data.taDaBills?.length || 0} TA/DA bills`);

  // 16. Lab Parts, Ins & Outs
  for (const item of data.labParts || []) {
    await prisma.labPart.upsert({
      where: { id: item.id },
      create: item,
      update: item,
    });
  }
  for (const item of data.labIns || []) {
    await prisma.labIn.upsert({
      where: { id: item.id },
      create: item,
      update: item,
    });
  }
  for (const item of data.labOuts || []) {
    await prisma.labOut.upsert({
      where: { id: item.id },
      create: item,
      update: item,
    });
  }
  console.log(`✓ Restored lab inventory records`);

  console.log('🎉 SQLite data restore completed successfully!');
}

restoreAll()
  .catch((e) => {
    console.error('Failed to restore data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
