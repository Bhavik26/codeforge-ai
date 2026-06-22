import { Request, Response, NextFunction } from 'express';

export const validationMiddleware = (
  _req: Request,
  _res: Response,
  next: NextFunction
) => {
  // Validation middleware will be implemented
  next();
};
