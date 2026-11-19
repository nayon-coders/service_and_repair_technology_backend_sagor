import { prisma } from '../config/prisma';
import { LoginInput, UserResponse } from '../types';
import { comparePassword, hashPassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { AppError } from '../utils/appError';
import { UpdateProfileInput, ChangePasswordInput } from '../validators/authValidator';

export interface LoginResult {
  user: UserResponse;
  token: string;
}

export const loginAdmin = async (input: LoginInput): Promise<LoginResult> => {
  const { email, password } = input;

  // Find user with role and permissions
  const user = await prisma.user.findUnique({
    where: { email },
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
    throw new AppError('Invalid email or password.', 401);
  }

  // Verify password
  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401);
  }

  // Verify account is active
  if (!user.isActive) {
    throw new AppError(
      'Your account has been deactivated. Please contact an administrator.',
      403
    );
  }

  const roleName = user.role?.name || user.roleEnum || 'Admin';
  const isSuperAdmin = roleName === 'Super Admin' || user.roleEnum === 'SUPER_ADMIN';

  const permissions = isSuperAdmin
    ? ['*']
    : user.role?.rolePermissions.map((rp) => rp.permission.key) || [];

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: roleName,
  });

  const sanitizedUser: UserResponse = {
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

  return {
    user: sanitizedUser,
    token,
  };
};

export const getAdminProfile = async (userId: string): Promise<UserResponse> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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
    throw new AppError('User not found.', 404);
  }

  const roleName = user.role?.name || user.roleEnum || 'Admin';
  const isSuperAdmin = roleName === 'Super Admin' || user.roleEnum === 'SUPER_ADMIN';

  const permissions = isSuperAdmin
    ? ['*']
    : user.role?.rolePermissions.map((rp) => rp.permission.key) || [];

  return {
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
};

export const updateAdminProfile = async (
  userId: string,
  input: UpdateProfileInput
): Promise<UserResponse> => {
  // Check if another user is using the email
  const existing = await prisma.user.findFirst({
    where: {
      email: input.email,
      NOT: { id: userId },
    },
  });

  if (existing) {
    throw new AppError('An account with this email address already exists.', 409);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: input.name,
      email: input.email,
    },
  });

  return getAdminProfile(userId);
};

export const changeAdminPassword = async (
  userId: string,
  input: ChangePasswordInput
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  // Validate current password
  const isMatch = await comparePassword(input.currentPassword, user.password);
  if (!isMatch) {
    throw new AppError('Current password is incorrect.', 400);
  }

  // Hash new password
  const newHashedPassword = await hashPassword(input.newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: {
      password: newHashedPassword,
    },
  });
};
