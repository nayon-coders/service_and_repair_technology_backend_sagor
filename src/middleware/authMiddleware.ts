import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/appError';

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // 1. Check HttpOnly cookie
    if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    // 2. Fallback to Authorization Header (Bearer token)
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Authentication required. No token provided.', 401);
    }

    // Verify token
    const decoded = verifyToken(token);

    // Fetch user with role and permissions
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User belonging to this token no longer exists.', 401);
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Contact an administrator.', 403);
    }

    const roleName = user.role?.name || user.roleEnum || 'Admin';
    const isSuperAdmin = roleName === 'Super Admin' || user.roleEnum === 'SUPER_ADMIN';

    const permissions = isSuperAdmin
      ? ['*']
      : user.role?.rolePermissions.map((rp) => rp.permission.key) || [];

    // Attach user to request
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: roleName,
      roleId: user.roleId,
      isActive: user.isActive,
      permissions,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Unauthorized. Please authenticate first.', 401));
    }

    if (
      req.user.role === 'Super Admin' ||
      req.user.role === 'SUPER_ADMIN' ||
      roles.includes(req.user.role)
    ) {
      return next();
    }

    return next(
      new AppError('Forbidden. You do not have permission to access this resource.', 403)
    );
  };
};

export const requirePermission = (permissionKey: string) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Unauthorized. Please authenticate first.', 401));
    }

    const userPerms = req.user.permissions || [];
    const hasPermission =
      req.user.role === 'Super Admin' ||
      req.user.role === 'SUPER_ADMIN' ||
      userPerms.includes('*') ||
      userPerms.includes(permissionKey);

    if (!hasPermission) {
      return next(
        new AppError(
          `Forbidden. You lack the '${permissionKey}' permission required for this resource.`,
          403
        )
      );
    }

    next();
  };
};
