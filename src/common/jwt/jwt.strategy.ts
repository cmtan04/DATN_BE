import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';

import { JwtPayload } from '@dtos/jwt.dto';
import { UserDecoratorDtoResponse } from '@dtos/user/user.dto';
import { TBUserDefault } from '@/entities/user/user_default.entity';
import { TBTokenBlacklist } from '@/entities/token_blacklist.entity';
import { UserStatus } from '@/assets/enum/user.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(TBUserDefault)
    private readonly userRepository: Repository<TBUserDefault>,
    @InjectRepository(TBTokenBlacklist)
    private readonly blacklistRepository: Repository<TBTokenBlacklist>,
  ) {
    super({
      // 1. Tự động trích xuất token từ Header "Authorization: Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // 2. Không cho phép token hết hạn đi qua
      ignoreExpiration: false,

      // 3. Sử dụng Secret Key để giải mã token
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  /**
   * validate: Được gọi sau khi JWT đã verify chữ ký thành công.
   * Kết quả return sẽ được gán vào `req.user`.
   */
  async validate(payload: JwtPayload): Promise<UserDecoratorDtoResponse> {
    // 0. Check if token has been blacklisted (revoked via logout)
    if (payload.jti) {
      const isBlacklisted = await this.blacklistRepository.exists({
        where: { jti: payload.jti },
      });
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    // 1. Tìm user trong DB để đảm bảo user vẫn tồn tại và lấy data mới nhất
    // (Optional: Có thể dùng `select` để tối ưu các cột cần lấy, tránh lấy password)
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    // 2. Kiểm tra tồn tại và trạng thái Active
    if (user?.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User no longer exists or is inactive');
    }

    if (!user?.isEmailVerified) {
      throw new UnauthorizedException('User email is not verified');
    }

    return {
      id: user.id,
      email: user.email,
      status: user.status,
      role: user.userRole,
    };
  }
}
