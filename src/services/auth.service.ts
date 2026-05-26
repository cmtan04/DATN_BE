import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { SignInRequestDto, SignInResponseDto } from '@/dtos/auth/signIn.dto';
import { SignUpRequestDto, SignUpResponseDto } from '@/dtos/auth/signUp.dto';
import { AuthRepository } from '@/repositories/auth.repository';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from '@/dtos/jwt.dto';
import { JwtService } from '@nestjs/jwt';
import { TBUserDefault } from "@/entities/user/user_default.entity";

const DEFAULT_USER_ROLE = 1;
const ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

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
        password: await this.hashPassword(payload.password),
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
      throw new BadRequestException('Missing email or password');
    }

    const user = await this.authRepository.findByEmail(payload.email);
    if (
      !user ||
      !(await this.verifyPassword(payload.password, user.password))
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }
    try {
      const jwtPayload: JwtPayload = {
        sub: user.id,
        username: user.userName,
        email: user.email,
        status: user.status,
        role: user.userRole,
        isEmailVerified: user.isEmailVerified,
      };
      const rememberMe = payload.rememberMe || false;
      const accessToken = this.jwtService.sign(jwtPayload, {
        expiresIn: rememberMe ? '1h' : '1d',
      });

      const result: SignInResponseDto = {
        message: 'Sign in successfully',
        accessToken,
      };

      if (rememberMe) {
        const refreshTokenPayload = { ...jwtPayload, type: 'refresh' };
        const refreshToken = this.jwtService.sign(refreshTokenPayload, {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        });
        result.refreshToken = refreshToken;
      }

      return result;
    } catch (error) {
      throw new UnauthorizedException('Failed to generate access token');
    }
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

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, ROUNDS);
  }

  private async verifyPassword(
    password: string,
    storedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, storedPassword);
  }

  public async refreshToken(refreshToken: string): Promise<SignInResponseDto> {
    try {
      const decoded = this.jwtService.verify(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });

      if (decoded.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const jwtPayload: JwtPayload = {
        sub: decoded.sub,
        username: decoded.username,
        email: decoded.email,
        status: decoded.status,
        role: decoded.role,
        isEmailVerified: decoded.isEmailVerified,
      };

      const accessToken = this.jwtService.sign(jwtPayload, {
        expiresIn: '1d',
      });

      return {
        message: 'Token refreshed successfully',
        accessToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
