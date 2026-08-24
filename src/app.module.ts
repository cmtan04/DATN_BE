import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './data-source';
import { AuthModule } from './modules/auth.module';
import { LocationModule } from './modules/location.module';
import { UserModule } from './modules/user.module';
import { AdminModule } from './modules/admin.module';
import { NotificationModule } from './modules/notification.module';
import { CloudinaryModule } from './modules/cloudinary.module';
import { ServiceModule } from './modules/service.module';
import { JwtAuthGuard } from './common/jwt/jwt.guard';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OtpModule } from './modules/OTP.module';
import { BookingModule } from './modules/booking.module';
import { RolesGuard } from './common/guards/role.guard';
import { ScheduleModule } from '@nestjs/schedule';
import { MailModule } from './modules/mail.module';
import { PaymentModule } from './modules/payment.module';
import { BookingProcessModule } from './modules/bookingProcess.module';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';
import { OwnerModule } from './modules/owner.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: () => dataSourceOptions,
      dataSourceFactory: async (options) => {
        if (!options) {
          throw new Error('Invalid options passed');
        }
        // Bọc DataSource bằng addTransactionalDataSource
        return addTransactionalDataSource(new DataSource(options));
      },
    }),

    AuthModule,
    LocationModule,
    UserModule,
    AdminModule,
    OwnerModule,
    NotificationModule,
    PaymentModule,
    CloudinaryModule,
    ServiceModule,
    OtpModule,
    BookingModule,
    BookingProcessModule,
    MailModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
