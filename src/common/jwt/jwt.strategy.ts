import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '@dtos/jwt.dto';
import { UserDecoratorDtoResponse } from '@dtos/user/user.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      // 1. Tự động trích xuất token từ Header "Authorization: Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      
      // 2. Không cho phép token hết hạn đi qua
      ignoreExpiration: false,
      
      // 3. Sử dụng Secret Key để giải mã và kiểm tra chữ ký token
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  /**
   * validate: Được gọi sau khi JWT đã giải mã thành công.
   * Kết quả trả về sẽ được Nest gán vào object Request.
   */
  validate(payload: JwtPayload): UserDecoratorDtoResponse {
    // Chuyển đổi dữ liệu từ Token Payload sang DTO phản hồi tiêu chuẩn của User
    return {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
      password: '', // Không trả password trong token/request user
      fullName: payload.fullName,
      status: payload.status,
      role: payload.role,
      isEmailVerified: payload.isEmailVerified,
    };
  }
}
