import { prisma } from '../config/prisma';
import { hashPassword } from '../utils/password';
import { env } from '../config/environment';

export const seedDatabase = async (): Promise<void> => {
  console.log('🌱 Starting Comprehensive Database Seed (Phase 5)...');

  // 1. Seed Roles
  const rolesData = [
    { name: 'Super Admin', description: 'Full system access and governance with unrestricted permissions.' },
    { name: 'Admin', description: 'Administrative operations across all business management modules.' },
    { name: 'Manager', description: 'Operational oversight and department-level management.' },
    { name: 'Employee', description: 'Staff member with basic operational viewing and processing tasks.' },
  ];

  const roleMap: Record<string, string> = {};
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: { name: r.name, description: r.description, isActive: true },
    });
    roleMap[r.name] = role.id;
  }
  console.log('✅ Roles seeded successfully (Super Admin, Admin, Manager, Employee).');

  // 2. Seed Permissions
  const permissionsData = [
    // Dashboard
    { key: 'dashboard.view', name: 'View Dashboard', description: 'View dashboard overview and KPI statistics.' },
    // Management
    { key: 'management.view', name: 'View Management Module', description: 'Access management domain section.' },
    { key: 'management.income.view', name: 'View Income', description: 'View income entries and invoices.' },
    { key: 'management.income.create', name: 'Create Income', description: 'Create new income transactions.' },
    { key: 'management.income.edit', name: 'Edit Income', description: 'Modify existing income transactions.' },
    { key: 'management.income.delete', name: 'Delete Income', description: 'Delete income transactions.' },
    { key: 'management.expense.view', name: 'View Expense', description: 'View business expenditures.' },
    { key: 'management.salary.view', name: 'View Salary', description: 'View payroll and salary records.' },
    { key: 'management.office-rent.view', name: 'View Office Rent', description: 'View rent and lease agreements.' },
    { key: 'management.ta-da.view', name: 'View TA/DA', description: 'View travel and daily allowances.' },
    { key: 'management.others.view', name: 'View Other Expenses', description: 'View miscellaneous expense records.' },
    // Service
    { key: 'service.view', name: 'View Service Module', description: 'Access service operations section.' },
    { key: 'service.lab-in.view', name: 'View Lab In', description: 'View lab intake records and diagnostic intake.' },
    { key: 'service.lab-out.view', name: 'View Lab Out', description: 'View lab outgoing delivery and sample records.' },
    // Employee Management
    { key: 'employee.view', name: 'View Employee Management', description: 'Access employee directory, profiles, and salary info.' },
    // Customer
    { key: 'customer.view', name: 'View Customer Module', description: 'Access customer relationship section.' },
    { key: 'customer.corporate.view', name: 'View Corporate Customers', description: 'Access corporate customer category.' },
    { key: 'customer.corporate.bill.view', name: 'View Corporate Bills', description: 'View corporate invoices and billing.' },
    { key: 'customer.corporate.requisition.view', name: 'View Corporate Requisitions', description: 'View corporate requisition orders.' },
    { key: 'customer.corporate.gate-pass.view', name: 'View Corporate Gate Pass', description: 'View corporate gate passes.' },
    { key: 'customer.non-corporate.view', name: 'View Non-Corporate Customers', description: 'Access retail customer category.' },
    { key: 'customer.non-corporate.requisition.view', name: 'View Non-Corporate Requisitions', description: 'View retail requisition slips.' },
    { key: 'customer.non-corporate.bill.view', name: 'View Non-Corporate Bills', description: 'View retail receipts and bills.' },
    { key: 'customer.non-corporate.gate-pass.view', name: 'View Non-Corporate Gate Pass', description: 'View retail gate passes.' },
    // Settings
    { key: 'settings.view', name: 'View Settings Module', description: 'Access system settings section.' },
    { key: 'settings.profile.view', name: 'View Profile Settings', description: 'View and update admin profile.' },
    { key: 'settings.change-password.view', name: 'Change Password', description: 'Update user account password.' },
    { key: 'settings.system.view', name: 'View System Settings', description: 'View platform configuration settings.' },
  ];

  const permissionMap: Record<string, string> = {};
  for (const p of permissionsData) {
    const perm = await prisma.permission.upsert({
      where: { key: p.key },
      update: { name: p.name, description: p.description },
      create: { key: p.key, name: p.name, description: p.description },
    });
    permissionMap[p.key] = perm.id;
  }
  console.log(`✅ ${permissionsData.length} Permissions seeded successfully.`);

  // 3. Link Role-Permissions
  // Super Admin gets ALL permissions
  for (const permKey of Object.keys(permissionMap)) {
    const permId = permissionMap[permKey];
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roleMap['Super Admin'],
          permissionId: permId,
        },
      },
      update: {},
      create: {
        roleId: roleMap['Super Admin'],
        permissionId: permId,
      },
    });
  }

  // Admin gets all view and operational permissions
  for (const permKey of Object.keys(permissionMap)) {
    const permId = permissionMap[permKey];
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roleMap['Admin'],
          permissionId: permId,
        },
      },
      update: {},
      create: {
        roleId: roleMap['Admin'],
        permissionId: permId,
      },
    });
  }

  // Manager gets operational views
  const managerPerms = [
    'dashboard.view',
    'management.view',
    'management.income.view',
    'management.expense.view',
    'management.salary.view',
    'management.office-rent.view',
    'management.ta-da.view',
    'management.others.view',
    'service.view',
    'service.lab-in.view',
    'service.lab-out.view',
    'employee.view',
    'customer.view',
    'customer.corporate.view',
    'customer.corporate.bill.view',
    'customer.corporate.requisition.view',
    'customer.corporate.gate-pass.view',
    'customer.non-corporate.view',
    'customer.non-corporate.requisition.view',
    'customer.non-corporate.bill.view',
    'customer.non-corporate.gate-pass.view',
    'settings.view',
    'settings.profile.view',
    'settings.change-password.view',
  ];
  for (const key of managerPerms) {
    if (permissionMap[key]) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: roleMap['Manager'],
            permissionId: permissionMap[key],
          },
        },
        update: {},
        create: {
          roleId: roleMap['Manager'],
          permissionId: permissionMap[key],
        },
      });
    }
  }

  // Employee gets staff-level view permissions
  const employeePerms = [
    'dashboard.view',
    'service.view',
    'service.lab-in.view',
    'service.lab-out.view',
    'employee.view',
    'customer.view',
    'customer.non-corporate.view',
    'customer.non-corporate.requisition.view',
    'settings.view',
    'settings.profile.view',
    'settings.change-password.view',
  ];
  for (const key of employeePerms) {
    if (permissionMap[key]) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: roleMap['Employee'],
            permissionId: permissionMap[key],
          },
        },
        update: {},
        create: {
          roleId: roleMap['Employee'],
          permissionId: permissionMap[key],
        },
      });
    }
  }
  console.log('✅ Role-Permission mappings seeded successfully.');

  // 4. Ensure Super Admin user exists and is linked to 'Super Admin' role
  const adminEmail = env.initialAdminEmail.toLowerCase().trim();
  const hashedPassword = await hashPassword(env.initialAdminPassword);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      roleId: roleMap['Super Admin'],
      roleEnum: 'SUPER_ADMIN',
    },
    create: {
      name: env.initialAdminName,
      email: adminEmail,
      password: hashedPassword,
      roleEnum: 'SUPER_ADMIN',
      roleId: roleMap['Super Admin'],
      isActive: true,
    },
  });
  console.log(`✅ Super Admin user (${adminEmail}) linked to Role: Super Admin.`);

  // 5. Seed Navigation Menus Hierarchically (Exact Hierarchy from Spec)
  // Define top-level parents first
  const topMenus = [
    {
      key: 'dashboard',
      title: 'Dashboard',
      path: '/dashboard',
      icon: 'LayoutDashboard',
      sortOrder: 1,
      requiredPermission: 'dashboard.view',
    },
    {
      key: 'management',
      title: 'Management',
      path: null,
      icon: 'Briefcase',
      sortOrder: 2,
      requiredPermission: 'management.view',
    },
    {
      key: 'service',
      title: 'Service',
      path: null,
      icon: 'Wrench',
      sortOrder: 3,
      requiredPermission: 'service.view',
    },
    {
      key: 'customer',
      title: 'Customer',
      path: null,
      icon: 'Users',
      sortOrder: 4,
      requiredPermission: 'customer.view',
    },
    {
      key: 'employee-management',
      title: 'Employee Management',
      path: '/employees',
      icon: 'UserCheck',
      sortOrder: 5,
      requiredPermission: 'employee.view',
    },
    {
      key: 'settings',
      title: 'Settings',
      path: null,
      icon: 'Settings',
      sortOrder: 6,
      requiredPermission: 'settings.view',
    },
  ];

  const menuMap: Record<string, string> = {};
  for (const m of topMenus) {
    const menu = await prisma.navigationMenu.upsert({
      where: { key: m.key },
      update: {
        title: m.title,
        path: m.path,
        icon: m.icon,
        sortOrder: m.sortOrder,
        requiredPermission: m.requiredPermission,
        parentId: null,
        isActive: true,
      },
      create: {
        key: m.key,
        title: m.title,
        path: m.path,
        icon: m.icon,
        sortOrder: m.sortOrder,
        requiredPermission: m.requiredPermission,
        parentId: null,
        isActive: true,
      },
    });
    menuMap[m.key] = menu.id;
  }

  // Level 1: Children of Management
  const managementChildren = [
    { key: 'management-income', title: 'Income', path: '/management/income', icon: 'TrendingUp', sortOrder: 1, requiredPermission: 'management.income.view' },
    { key: 'management-expense', title: 'Expense', path: '/management/expense', icon: 'TrendingDown', sortOrder: 2, requiredPermission: 'management.expense.view' },
    { key: 'management-salary', title: 'Salary', path: '/management/salary', icon: 'DollarSign', sortOrder: 3, requiredPermission: 'management.salary.view' },
    { key: 'management-office-rent', title: 'Office Rent', path: '/management/office-rent', icon: 'Building2', sortOrder: 4, requiredPermission: 'management.office-rent.view' },
    { key: 'management-ta-da', title: 'TA/DA', path: '/management/ta-da', icon: 'Compass', sortOrder: 5, requiredPermission: 'management.ta-da.view' },
    { key: 'management-others', title: 'Others', path: '/management/others', icon: 'MoreHorizontal', sortOrder: 6, requiredPermission: 'management.others.view' },
  ];
  for (const m of managementChildren) {
    const item = await prisma.navigationMenu.upsert({
      where: { key: m.key },
      update: {
        title: m.title,
        path: m.path,
        icon: m.icon,
        sortOrder: m.sortOrder,
        requiredPermission: m.requiredPermission,
        parentId: menuMap['management'],
        isActive: true,
      },
      create: {
        key: m.key,
        title: m.title,
        path: m.path,
        icon: m.icon,
        sortOrder: m.sortOrder,
        requiredPermission: m.requiredPermission,
        parentId: menuMap['management'],
        isActive: true,
      },
    });
    menuMap[m.key] = item.id;
  }

  // Level 1: Children of Service
  const serviceChildren = [
    { key: 'service-lab-in', title: 'Lab In', path: '/service/lab-in', icon: 'ArrowDownLeft', sortOrder: 1, requiredPermission: 'service.lab-in.view' },
    { key: 'service-lab-out', title: 'Lab Out', path: '/service/lab-out', icon: 'ArrowUpRight', sortOrder: 2, requiredPermission: 'service.lab-out.view' },
  ];
  for (const m of serviceChildren) {
    const item = await prisma.navigationMenu.upsert({
      where: { key: m.key },
      update: {
        title: m.title,
        path: m.path,
        icon: m.icon,
        sortOrder: m.sortOrder,
        requiredPermission: m.requiredPermission,
        parentId: menuMap['service'],
        isActive: true,
      },
      create: {
        key: m.key,
        title: m.title,
        path: m.path,
        icon: m.icon,
        sortOrder: m.sortOrder,
        requiredPermission: m.requiredPermission,
        parentId: menuMap['service'],
        isActive: true,
      },
    });
    menuMap[m.key] = item.id;
  }

  // Level 1: Children of Customer (Corporate and Non-Corporate sub-parents)
  const customerSubParents = [
    { key: 'customer-corporate', title: 'Corporate', path: null, icon: 'Building', sortOrder: 1, requiredPermission: 'customer.corporate.view' },
    { key: 'customer-non-corporate', title: 'Non-Corporate', path: null, icon: 'User', sortOrder: 2, requiredPermission: 'customer.non-corporate.view' },
  ];
  for (const m of customerSubParents) {
    const item = await prisma.navigationMenu.upsert({
      where: { key: m.key },
      update: {
        title: m.title,
        path: m.path,
        icon: m.icon,
        sortOrder: m.sortOrder,
        requiredPermission: m.requiredPermission,
        parentId: menuMap['customer'],
        isActive: true,
      },
      create: {
        key: m.key,
        title: m.title,
        path: m.path,
        icon: m.icon,
        sortOrder: m.sortOrder,
        requiredPermission: m.requiredPermission,
        parentId: menuMap['customer'],
        isActive: true,
      },
    });
    menuMap[m.key] = item.id;
  }

  // Level 2: Children of Corporate
  const corporateChildren = [
    { key: 'customer-corporate-bill', title: 'Bill', path: '/customer/corporate/bill', icon: 'Receipt', sortOrder: 1, requiredPermission: 'customer.corporate.bill.view' },
    { key: 'customer-corporate-requisition', title: 'Requisition', path: '/customer/corporate/requisition', icon: 'ClipboardList', sortOrder: 2, requiredPermission: 'customer.corporate.requisition.view' },
    { key: 'customer-corporate-gate-pass', title: 'Gate Pass', path: '/customer/corporate/gate-pass', icon: 'KeyRound', sortOrder: 3, requiredPermission: 'customer.corporate.gate-pass.view' },
  ];
  for (const m of corporateChildren) {
    const item = await prisma.navigationMenu.upsert({
      where: { key: m.key },
      update: {
        title: m.title,
        path: m.path,
        icon: m.icon,
        sortOrder: m.sortOrder,
        requiredPermission: m.requiredPermission,
        parentId: menuMap['customer-corporate'],
        isActive: true,
      },
      create: {
        key: m.key,
        title: m.title,
        path: m.path,
        icon: m.icon,
        sortOrder: m.sortOrder,
        requiredPermission: m.requiredPermission,
        parentId: menuMap['customer-corporate'],
        isActive: true,
      },
    });
    menuMap[m.key] = item.id;
  }

  // Level 2: Children of Non-Corporate
  const nonCorporateChildren = [
    { key: 'customer-non-corporate-bill', title: 'Bill', path: '/customer/non-corporate/bill', icon: 'CreditCard', sortOrder: 1, requiredPermission: 'customer.non-corporate.bill.view' },
    { key: 'customer-non-corporate-requisition', title: 'Requisition', path: '/customer/non-corporate/requisition', icon: 'FileText', sortOrder: 2, requiredPermission: 'customer.non-corporate.requisition.view' },
    { key: 'customer-non-corporate-gate-pass', title: 'Gate Pass', path: '/customer/non-corporate/gate-pass', icon: 'Ticket', sortOrder: 3, requiredPermission: 'customer.non-corporate.gate-pass.view' },
  ];
  for (const m of nonCorporateChildren) {
    const item = await prisma.navigationMenu.upsert({
      where: { key: m.key },
      update: {
        title: m.title,
        path: m.path,
        icon: m.icon,
        sortOrder: m.sortOrder,
        requiredPermission: m.requiredPermission,
        parentId: menuMap['customer-non-corporate'],
        isActive: true,
      },
      create: {
        key: m.key,
        title: m.title,
        path: m.path,
        icon: m.icon,
        sortOrder: m.sortOrder,
        requiredPermission: m.requiredPermission,
        parentId: menuMap['customer-non-corporate'],
        isActive: true,
      },
    });
    menuMap[m.key] = item.id;
  }

  // Level 1: Children of Settings
  const settingsChildren = [
    { key: 'settings-profile', title: 'Profile', path: '/settings/profile', icon: 'UserCheck', sortOrder: 1, requiredPermission: 'settings.profile.view' },
    { key: 'settings-change-password', title: 'Change Password', path: '/settings/change-password', icon: 'Lock', sortOrder: 2, requiredPermission: 'settings.change-password.view' },
    { key: 'settings-system', title: 'System Settings', path: '/settings/system', icon: 'Sliders', sortOrder: 3, requiredPermission: 'settings.system.view' },
    { key: 'settings-problem-templates', title: 'Problem Templates', path: '/settings/problem-templates', icon: 'AlertCircle', sortOrder: 4, requiredPermission: 'settings.view' },
  ];
  for (const m of settingsChildren) {
    const item = await prisma.navigationMenu.upsert({
      where: { key: m.key },
      update: {
        title: m.title,
        path: m.path,
        icon: m.icon,
        sortOrder: m.sortOrder,
        requiredPermission: m.requiredPermission,
        parentId: menuMap['settings'],
        isActive: true,
      },
      create: {
        key: m.key,
        title: m.title,
        path: m.path,
        icon: m.icon,
        sortOrder: m.sortOrder,
        requiredPermission: m.requiredPermission,
        parentId: menuMap['settings'],
        isActive: true,
      },
    });
    menuMap[m.key] = item.id;
  }

  console.log('✅ All 22 Navigation Menu nodes seeded with exact hierarchy and permissions.');
  console.log('🎉 Database Seeding completed successfully.');
};

if (require.main === module) {
  seedDatabase()
    .catch((e) => {
      console.error('❌ Seeding failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

