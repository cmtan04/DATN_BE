import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@/assets/enum/user.enum';

export const ROLE_KEY = 'roles';
export const Role = (...roles: UserRole[]) => SetMetadata(ROLE_KEY, roles);
