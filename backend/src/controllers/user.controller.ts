import { Request, Response, NextFunction } from 'express';
import creditService from '../services/credit.service';
import { UnauthorizedError } from '../utils/errors';

export class UserController {
  // Get user credits
  async getCredits(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const credits = await creditService.getUserCredits(req.user.userId);

      res.json({
        success: true,
        credits,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get credit history
  async getCreditHistory(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const history = await creditService.getCreditHistory(
        req.user.userId,
        limit,
        offset
      );

      res.json({
        success: true,
        ...history,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
