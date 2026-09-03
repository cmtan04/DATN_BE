export interface JwtPayload {
  sub: number; // userId
  email: string;
  fullName?: string;
  status: number; // UserStatus
  role: number; // UserRole
  isEmailVerified: boolean;
  jti?: string; // JWT ID — dùng để blacklist khi logout
}
