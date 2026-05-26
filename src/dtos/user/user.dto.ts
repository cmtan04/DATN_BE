import { UserRole, UserStatus } from '@assets/enum/user.enum';
export class UserDecoratorDtoResponse {
  id: number;
  username: string;
  email: string;
  password: string;
  phone?: string;
  fullName?: string;
  dateOfBirth?: Date;
  status: UserStatus;
  role: UserRole;
  isEmailVerified: boolean;
}