import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly reflector: Reflector) {
    super();
  }

  /**
   * canActivate: Quyết định xem request có được phép đi tiếp hay không.
   */
  canActivate(context: ExecutionContext) {
    // 1. Kiểm tra xem Route hiện tại có được đánh dấu là @Public() không
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2. Nếu là route công khai, cho phép truy cập ngay không cần token
    if (isPublic) {
      return true;
    }

    // 3. Nếu không, gọi canActivate của AuthGuard('jwt') để kích hoạt JwtStrategy
    return super.canActivate(context);
  }

  /**
   * handleRequest: Xử lý kết quả sau khi Passport (JwtStrategy) đã xác thực xong.
   */
  handleRequest<TUser = any>(err: any, user: any, info: any): TUser {
    // Nếu có lỗi xác thực hoặc không tìm thấy user (token sai/hết hạn)
    if (err || !user) {
      this.logger.error('Authentication failed!');

      // Log thêm thông tin chi tiết nếu có (ví dụ: "jwt expired")
      if (info) {
        this.logger.error('Auth Info: ' + JSON.stringify(info));
      }

      // Log lỗi kỹ thuật nếu có
      if (err) {
        this.logger.error('Auth Error: ' + JSON.stringify(err));
      }

      // Ném lỗi 401 Unauthorized về phía Client
      throw err ?? new UnauthorizedException('Authentication failed');
    }

    // Nếu mọi thứ hợp lệ, trả về object user (sẽ được Nest gán vào request.user)
    return user as TUser;
  }
}
