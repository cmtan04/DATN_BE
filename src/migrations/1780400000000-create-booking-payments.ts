import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBookingPayments1780400000000
  implements MigrationInterface
{
  name = 'CreateBookingPayments1780400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const bookingTable = await queryRunner.getTable('tb_booking');

    if (!bookingTable) {
      await queryRunner.query(`
        CREATE TABLE \`tb_booking\` (
          \`id\` int NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
          \`userId\` int NOT NULL COMMENT 'ID nguoi dat phong',
          \`locationId\` int NOT NULL COMMENT 'ID dia diem',
          \`startDate\` date NOT NULL COMMENT 'Ngay bat dau dat phong',
          \`endDate\` date NOT NULL COMMENT 'Ngay ket thuc dat phong',
          \`guestCount\` int NOT NULL COMMENT 'So luong khach',
          \`contactName\` varchar(255) NOT NULL,
          \`contactPhone\` varchar(50) NOT NULL,
          \`contactEmail\` varchar(255) NOT NULL,
          \`note\` text NULL,
          \`status\` varchar(32) NOT NULL DEFAULT 'PENDING_PAYMENT',
          \`totalAmount\` int NOT NULL COMMENT 'Tong tien VND',
          \`currency\` varchar(3) NOT NULL DEFAULT 'vnd',
          \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thoi diem tao',
          \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thoi diem cap nhat',
          \`deletedAt\` timestamp(6) NULL COMMENT 'Thoi diem xoa mem',
          PRIMARY KEY (\`id\`),
          INDEX \`IDX_tb_booking_location_dates_status\` (\`locationId\`, \`startDate\`, \`endDate\`, \`status\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
    }

    const paymentTable = await queryRunner.getTable('tb_payment');

    if (!paymentTable) {
      await queryRunner.query(`
        CREATE TABLE \`tb_payment\` (
          \`id\` int NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
          \`userId\` int NOT NULL COMMENT 'ID nguoi thanh toan',
          \`bookingId\` int NOT NULL COMMENT 'ID booking',
          \`method\` varchar(20) NOT NULL DEFAULT 'stripe',
          \`amount\` int NOT NULL COMMENT 'So tien VND',
          \`currency\` varchar(3) NOT NULL DEFAULT 'vnd',
          \`status\` varchar(32) NOT NULL DEFAULT 'UNPAID',
          \`stripeSessionId\` varchar(255) NULL,
          \`stripePaymentIntentId\` varchar(255) NULL,
          \`checkoutUrl\` varchar(2048) NULL,
          \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thoi diem tao',
          \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thoi diem cap nhat',
          \`deletedAt\` timestamp(6) NULL COMMENT 'Thoi diem xoa mem',
          PRIMARY KEY (\`id\`),
          INDEX \`IDX_tb_payment_booking\` (\`bookingId\`),
          UNIQUE INDEX \`IDX_tb_payment_stripe_session\` (\`stripeSessionId\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
    }

    const webhookTable = await queryRunner.getTable('tb_stripe_webhook_event');

    if (!webhookTable) {
      await queryRunner.query(`
        CREATE TABLE \`tb_stripe_webhook_event\` (
          \`id\` int NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
          \`stripeEventId\` varchar(255) NOT NULL,
          \`type\` varchar(255) NOT NULL,
          \`processedAt\` timestamp NOT NULL,
          \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thoi diem tao',
          \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thoi diem cap nhat',
          \`deletedAt\` timestamp(6) NULL COMMENT 'Thoi diem xoa mem',
          PRIMARY KEY (\`id\`),
          UNIQUE INDEX \`IDX_tb_stripe_webhook_event_id\` (\`stripeEventId\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const webhookTable = await queryRunner.getTable('tb_stripe_webhook_event');

    if (webhookTable) {
      await queryRunner.query('DROP TABLE `tb_stripe_webhook_event`');
    }

    const paymentTable = await queryRunner.getTable('tb_payment');

    if (paymentTable) {
      await queryRunner.query('DROP TABLE `tb_payment`');
    }

    const bookingTable = await queryRunner.getTable('tb_booking');

    if (bookingTable) {
      await queryRunner.query('DROP TABLE `tb_booking`');
    }
  }
}
