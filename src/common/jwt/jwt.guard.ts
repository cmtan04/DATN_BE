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
   * Decide whether the current request can continue.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();

    if (isPublic) {
      const authorization = request.headers?.authorization as
        | string
        | undefined;

      if (!authorization?.startsWith('Bearer ')) {
        return true;
      }

      try {
        await Promise.resolve(
          super.canActivate(context) as boolean | Promise<boolean>,
        );
      } catch (err) {
        this.logger.error('Authentication failed for public route!');
        this.logger.error('Auth Error: ' + JSON.stringify(err));
      }

      return true;
    }

    return await Promise.resolve(
      super.canActivate(context) as boolean | Promise<boolean>,
    );
  }

  /**
   * Handle the result after Passport has validated the JWT.
   */
  handleRequest<TUser = any>(err: any, user: any, info: any): TUser {
    if (err || !user) {
      this.logger.error('Authentication failed!');

      if (info) {
        this.logger.error('Auth Info: ' + JSON.stringify(info));
      }

      if (err) {
        this.logger.error('Auth Error: ' + JSON.stringify(err));
      }

      throw err ?? new UnauthorizedException('Authentication failed');
    }

    return user as TUser;
  }
}
