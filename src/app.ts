import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { env } from './config/environment';
import { requestLogger } from './middleware/logger';
import { notFoundHandler } from './middleware/notFoundHandler';
import { errorHandler } from './middleware/errorHandler';
import { licenseMiddleware } from './middleware/licenseMiddleware';
import { prisma } from './config/prisma';
import apiRoutes from './routes';

const app: Application = express();

// Auto-seed initial admin and permissions if database is empty on first boot
let isDbInitialized = false;
app.use(async (_req, _res, next) => {
  if (!isDbInitialized) {
    try {
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        console.log('🌱 Database is empty, auto-seeding initial data...');
        const { seedDatabase } = await import('./scripts/seedDatabase');
        await seedDatabase();
      }
      isDbInitialized = true;
    } catch {
      // Ignore if database connection is pending
    }
  }
  next();
});

// Security and CORS middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        env.frontendUrl,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5000',
        'http://127.0.0.1:5000',
      ];
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('app://') ||
        origin.startsWith('file://') ||
        env.nodeEnv === 'development'
      ) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Request parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging middleware
app.use(requestLogger);

// License suspension validation
app.use('/api/v1', licenseMiddleware);

// API route registration
app.use('/api/v1', apiRoutes);

// Static frontend serving for Desktop standalone mode (if frontend/dist exists)
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// 404 fallback handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

export default app;
