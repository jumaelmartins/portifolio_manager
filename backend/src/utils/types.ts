import { Request } from 'express';
export enum UserStatus {
  PENDING = 1,
  ACTIVE = 2,
  INACTIVE = 3,
}
export enum UserRoles {
  SYSADMIN = 1,
  REGULAR = 2,
}

export interface JwtPayload {
  sub: string;
  role: string;
  status: string;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
