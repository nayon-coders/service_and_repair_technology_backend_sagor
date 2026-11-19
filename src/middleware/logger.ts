import morgan from 'morgan';
import { RequestHandler } from 'express';
import { env } from '../config/environment';

export const requestLogger: RequestHandler =
  env.nodeEnv === 'development'
    ? morgan('dev')
    : morgan('combined', {
        skip: (_req, res) => res.statusCode < 400,
      });

