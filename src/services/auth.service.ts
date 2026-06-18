import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SignInRequestDto, SignInResponseDto } from '@/dtos/auth/signIn.dto';
import { SignUpRequestDto, SignUpResponseDto } from '@/dtos/auth/signUp.dto';
import { AuthRepository } from '@/repositories/auth.repository';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from '@/dtos/jwt.dto';
import { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '@assets/enum/user.enum';
import { OtpService } from './OTP.service';
import { ResetPasswordDto } from '@/dtos/auth/forgotPassword.dto';
import { BadRequestException } from '@nestjs/common/exceptions';
import { TBUserDefault } from '@/entities/user/user_default.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

const DEFAULT_USER_ROLE = UserRole.USER;
const ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
    @InjectRepository(TBUserDefault)
    private readonly userRepository: Repository<TBUserDefault>,
  ) {}

  public async signUp(payload: SignUpRequestDto): Promise<SignUpResponseDto> {
    const existedEmail = await this.authRepository.findByEmail(payload.email);
    if (existedEmail) {
      throw new ConflictException('Email already exists');
    }

    await this.authRepository.createUser(
      {
        email: payload.email,
        password: await this.hashPassword(payload.password),
        userRole: DEFAULT_USER_ROLE,
        status: UserStatus.ACTIVE,
      },
      {
        fullName: payload.fullName,
        phoneNumber: payload.phoneNumber,
      },
    );

    return { message: 'Sign up successfully' };
  }

  public async signIn(payload: SignInRequestDto): Promise<SignInResponseDto> {
    const user = await this.authRepository.findByEmail(payload.email);
    if (
      !user ||
      !(await this.verifyPassword(payload.password, user.password))
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is not active');
    }

    try {
      const jwtPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        status: user.status,
        role: user.userRole,
        isEmailVerified: user.isEmailVerified,
      };
      const rememberMe = payload.rememberMe || false;
      const accessToken = this.jwtService.sign(jwtPayload, {
        expiresIn: '1d',
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

      const user = await this.authRepository.findById(Number(decoded.sub));
      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('User account is not active');
      }

      const jwtPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        status: user.status,
        role: user.userRole,
        isEmailVerified: user.isEmailVerified,
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

  public async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { resetToken, password } = resetPasswordDto;

    if (!resetToken?.trim() || !password?.trim()) {
      throw new BadRequestException('Reset token and password are required');
    }

    // Lấy email dựa theo resetToken
    const email = await this.otpService.getEmailFromToken({ resetToken });

    // Lấy user dựa theo email
    const user = await this.userRepository.findOne({
      where: { email },
    });
    if (!user) {
      throw new BadRequestException(
        'Không tìm thấy tài khoản liên kết với token này.',
      );
    }

    user.password = await this.hashPassword(password);
    await this.userRepository.update(
      { id: user.id },
      { password: user.password },
    );

    // Xóa record
    await this.otpService.deleteOldOtps(email);

    return {
      success: true,
      message: 'Mật khẩu của bạn đã được thay đổi thành công!',
    };
  }

  async pingDatabase(): Promise<void> {
    await this.authRepository.pingDatabase();
  }
}
