import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/environment';
import { requestLogger } from './middleware/logger';
import { notFoundHandler } from './middleware/notFoundHandler';
import { errorHandler } from './middleware/errorHandler';
import apiRoutes from './routes';

const app: Application = express();

// Security and CORS middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);

      const allowedOrigins = [env.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'];
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
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

// API route registration
app.use('/api/v1', apiRoutes);

// 404 fallback handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

export default app;
