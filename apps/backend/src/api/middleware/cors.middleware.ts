import { Request, Response, NextFunction } from 'express';

export const corsMiddleware = (
  _req: Request,
  _res: Response,
  next: NextFunction
) => {
  // CORS middleware is handled by cors package in app.ts
  next();
};
