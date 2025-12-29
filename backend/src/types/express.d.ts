// Extend Express Request to include authenticated user
declare namespace Express {
  export interface Request {
    user?: {
      userId: string;
      email: string;
      role: string;
    };
  }
}
