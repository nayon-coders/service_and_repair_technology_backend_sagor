import { prisma } from '../config/prisma';
import { RoleWithPermissions, PermissionResponse } from '../types';

export const getAllRoles = async (): Promise<RoleWithPermissions[]> => {
  const roles = await prisma.role.findMany({
    where: { isActive: true },
    include: {
      rolePermissions: {
        include: {
          permission: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return roles.map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description,
    isActive: role.isActive,
    permissions: role.rolePermissions.map((rp) => ({
      id: rp.permission.id,
      key: rp.permission.key,
      name: rp.permission.name,
      description: rp.permission.description,
    })),
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  }));
};

export const getAllPermissions = async (): Promise<PermissionResponse[]> => {
  const permissions = await prisma.permission.findMany({
    orderBy: { key: 'asc' },
  });

  return permissions.map((p) => ({
    id: p.id,
    key: p.key,
    name: p.name,
    description: p.description,
  }));
};

