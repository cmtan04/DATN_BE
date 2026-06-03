import * as dotenv from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SeederOptions } from 'typeorm-extension';
import { TBLocationAddress } from './entities/location/location-address.entity';
import { TBLocationMedia } from './entities/location/location_media.entity';
import { TBLocationService } from './entities/location/location_service.entity';
import { TBLocationType } from './entities/location/location_type.entity';
import { TBLocation } from './entities/location/location.entity';
import { TBService } from './entities/service.entity';
import { TBNotification } from './entities/notifications.entity';
import { TBBooking } from './entities/booking.entity';
import { TBPayment } from './entities/payment.entity';
import { TBPayosWebhookEvent } from './entities/payos-webhook-event.entity';
import { TBUserDefault } from './entities/user/user_default.entity';
import { TBUserProfile } from './entities/user/user_profile.entity';

dotenv.config();

const baseDataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  charset: 'utf8mb4',
  entities: [
    TBLocation,
    TBLocationAddress,
    TBLocationMedia,
    TBLocationService,
    TBLocationType,
    TBBooking,
    TBNotification,
    TBPayment,
    TBPayosWebhookEvent,
    TBService,
    TBUserDefault,
    TBUserProfile,
  ],
};

export const dataSourceOptions: DataSourceOptions = {
  ...baseDataSourceOptions,
  synchronize: process.env.TYPEORM_SYNC === 'true',
};

export const cliDataSourceOptions: DataSourceOptions & SeederOptions = {
  ...baseDataSourceOptions,
  migrations: ['src/migrations/*.ts'],
  seeds: ['src/seed/**/*{.ts,.js}'],
};

const dataSource = new DataSource(cliDataSourceOptions);
export default dataSource;
