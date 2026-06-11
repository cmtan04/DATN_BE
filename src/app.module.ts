import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './data-source';
import { AuthModule } from './modules/auth.module';
import { LocationModule } from './modules/location.module';
import { UserModule } from './modules/user.module';
import { AdminModule } from './modules/admin.module';
import { NotificationModule } from './modules/notification.module';
import { PaymentModule } from './modules/payment.module';
import { CloudinaryModule } from './modules/cloudinary.module';
import { ServiceModule } from './modules/service.module';
import { JwtAuthGuard } from './common/jwt/jwt.guard';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRoot(dataSourceOptions),
    AuthModule,
    LocationModule,
    UserModule,
    AdminModule,
    NotificationModule,
    PaymentModule,
    CloudinaryModule,
    ServiceModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
