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
  const databaseUrl = process.env.DATABASE_URL || '';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const jwtSecret = process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production';
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1d';
  const initialAdminName = process.env.INITIAL_ADMIN_NAME || 'Super Administrator';
  const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@example.com';
  const initialAdminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'AdminPass123!';

  if (!databaseUrl && nodeEnv === 'production') {
    throw new Error('DATABASE_URL environment variable is required in production');
  }

  if (jwtSecret === 'dev_jwt_secret_change_in_production' && nodeEnv === 'production') {
    throw new Error('JWT_SECRET must be explicitly set to a strong secret in production');
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
