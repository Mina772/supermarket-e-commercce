import { Role } from '../constants/roles';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface AuthUser {
      id: string;
      role: Role;
      email: string;
    }
    interface Request {
      user?: AuthUser;
      requestId?: string;
    }
  }
}

export {};
