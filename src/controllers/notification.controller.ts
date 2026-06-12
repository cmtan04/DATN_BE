import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Sse,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { ApiTags } from '@nestjs/swagger';
import { fromEvent, map, Observable } from 'rxjs';
import { Public } from '@/common/decorators/public.decorator';
import { JwtPayload } from '@/dtos/jwt.dto';
import { NotificationResponseDto } from '@/dtos/notification.dto';
import { NotificationService } from '@/services/notification.service';
import { User } from '@/common/decorators/user.decorator';

@Controller('notifications')
@ApiTags('Notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly eventEmitter: EventEmitter2,
    private readonly jwtService: JwtService,
  ) {}

  @Get('me')
  public async getCurrentUserNotifications(
    @User('id') userId: number,
  ): Promise<NotificationResponseDto[]> {
    return await this.notificationService.getCurrentUserNotifications(userId);
  }

  @Public()
  @Sse('stream/:userId')
  public streamNotifications(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('token') token?: string,
  ): Observable<MessageEvent> {
    this.assertStreamToken(token, userId);

    return fromEvent(this.eventEmitter, `notification.${userId}`).pipe(
      map(
        (data) =>
          ({
            data,
          }) as MessageEvent,
      ),
    );
  }

  @Patch(':id/read')
  public async markCurrentUserNotificationRead(
    @User('id') userId: number,
    @Param('id', ParseIntPipe) notificationId: number,
  ): Promise<NotificationResponseDto> {
    return await this.notificationService.markCurrentUserNotificationRead(
      userId,
      notificationId,
    );
  }

  private assertStreamToken(token: string | undefined, userId: number): void {
    if (!token) {
      throw new UnauthorizedException('Missing stream token');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);

      if (Number(payload.sub) !== userId) {
        throw new UnauthorizedException('Invalid stream token');
      }
    } catch {
      throw new UnauthorizedException('Invalid stream token');
    }
  }
}
