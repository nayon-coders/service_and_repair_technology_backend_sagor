import dotenv from 'dotenv';
import path from 'path';

// Load .env file from backend root or workspace root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// Fallback to current directory .env if present
dotenv.config();

interface Environment {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  databaseUrl: string;
  frontendUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  initialAdminName: string;
  initialAdminEmail: string;
  initialAdminPassword: string;
}

const getEnvironment = (): Environment => {
  const port = parseInt(process.env.PORT || '5000', 10);
  const nodeEnv = (process.env.NODE_ENV as Environment['nodeEnv']) || 'development';
  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    '';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_business_management_default_2026_x89a!';
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1d';
  const initialAdminName = process.env.INITIAL_ADMIN_NAME || 'Super Administrator';
  const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@example.com';
  const initialAdminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'AdminPass123!';

  if (!databaseUrl && nodeEnv === 'production') {
    console.warn('[WARN] DATABASE_URL is not set in production. Some features may fail.');
  }

  return {
    port,
    nodeEnv,
    databaseUrl,
    frontendUrl,
    jwtSecret,
    jwtExpiresIn,
    initialAdminName,
    initialAdminEmail,
    initialAdminPassword,
  };
};

export const env = getEnvironment();
