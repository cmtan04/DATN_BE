export interface JwtPayload {
  sub: number; // userId
  email: string;
  fullName?: string;
  status: number; // UserStatus
  role: number; // UserRole
  isEmailVerified: boolean;
}