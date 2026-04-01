import { Request, Response, NextFunction } from 'express';
import { AppError } from '../common/errors';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      status: 'fail',
      message: 'Validation failed',
      errors: err.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
    });
    return;
  }

  console.error('Unhandled Error 💥', err);
  
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
};
