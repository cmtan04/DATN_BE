import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { SignInRequestDto, SignInResponseDto } from '@/dtos/auth/signIn.dto';
import { SignUpRequestDto, SignUpResponseDto } from '@/dtos/auth/signUp.dto';
import { AuthRepository } from '@/repositories/auth.repository';

const DEFAULT_USER_ROLE = 1;

@Injectable()
export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  public async signUp(payload: SignUpRequestDto): Promise<SignUpResponseDto> {
    this.validateSignUpPayload(payload);

    const existedEmail = await this.authRepository.findByEmail(payload.email);
    if (existedEmail) {
      throw new ConflictException('Email already exists');
    }

    const existedUserName = await this.authRepository.findByUserName(
      payload.userName,
    );
    if (existedUserName) {
      throw new ConflictException('Username already exists');
    }

    await this.authRepository.createUser(
      {
        email: payload.email,
        password: this.hashPassword(payload.password),
        userName: payload.userName,
        userRole: DEFAULT_USER_ROLE,
      },
      {
        fullName: payload.fullName,
        phoneNumber: payload.phoneNumber,
      },
    );

    return { message: 'Sign up successfully' };
  }

  public async signIn(payload: SignInRequestDto): Promise<SignInResponseDto> {
    if (!payload.email || !payload.password) {
      throw new BadRequestException('Email and password are required');
    }

    const user = await this.authRepository.findByEmail(payload.email);
    if (!user || !this.verifyPassword(payload.password, user.password)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      accessToken: this.generateToken(),
      refreshToken: this.generateToken(),
    };
  }

  private validateSignUpPayload(payload: SignUpRequestDto): void {
    if (
      !payload.email ||
      !payload.password ||
      !payload.userName ||
      !payload.fullName ||
      !payload.phoneNumber
    ) {
      throw new BadRequestException('Missing required sign up information');
    }
  }

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');

    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, storedPassword: string): boolean {
    const [salt, hash] = storedPassword.split(':');
    if (!salt || !hash) {
      return password === storedPassword;
    }

    const hashBuffer = Buffer.from(hash, 'hex');
    const inputHashBuffer = scryptSync(password, salt, 64);

    return timingSafeEqual(hashBuffer, inputHashBuffer);
  }

  private generateToken(): string {
    return randomBytes(48).toString('hex');
  }
}
