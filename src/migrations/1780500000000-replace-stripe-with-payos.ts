import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class ReplaceStripeWithPayos1780500000000
  implements MigrationInterface
{
  name = 'ReplaceStripeWithPayos1780500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const paymentTable = await queryRunner.getTable('tb_payment');

    if (paymentTable) {
      const stripeSessionIndex = paymentTable.indices.find(
        (index) => index.name === 'IDX_tb_payment_stripe_session',
      );

      if (stripeSessionIndex) {
        await queryRunner.dropIndex('tb_payment', stripeSessionIndex);
      }

      if (paymentTable.findColumnByName('stripeSessionId')) {
        await queryRunner.dropColumn('tb_payment', 'stripeSessionId');
      }

      if (paymentTable.findColumnByName('stripePaymentIntentId')) {
        await queryRunner.dropColumn('tb_payment', 'stripePaymentIntentId');
      }

      if (!paymentTable.findColumnByName('payosOrderCode')) {
        await queryRunner.addColumn(
          'tb_payment',
          new TableColumn({
            name: 'payosOrderCode',
            type: 'int',
            isNullable: true,
          }),
        );
      }

      if (!paymentTable.findColumnByName('payosPaymentLinkId')) {
        await queryRunner.addColumn(
          'tb_payment',
          new TableColumn({
            name: 'payosPaymentLinkId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          }),
        );
      }

      if (!paymentTable.findColumnByName('qrCode')) {
        await queryRunner.addColumn(
          'tb_payment',
          new TableColumn({
            name: 'qrCode',
            type: 'text',
            isNullable: true,
          }),
        );
      }

      const refreshedPaymentTable = await queryRunner.getTable('tb_payment');
      const payosOrderIndex = refreshedPaymentTable?.indices.find(
        (index) => index.name === 'IDX_tb_payment_payos_order',
      );

      if (!payosOrderIndex) {
        await queryRunner.createIndex(
          'tb_payment',
          new TableIndex({
            name: 'IDX_tb_payment_payos_order',
            columnNames: ['payosOrderCode'],
            isUnique: true,
          }),
        );
      }

      await queryRunner.query(
        "UPDATE `tb_payment` SET `method` = 'payos' WHERE `method` = 'stripe'",
      );
      await queryRunner.query(
        "ALTER TABLE `tb_payment` ALTER `method` SET DEFAULT 'payos'",
      );
    }

    const stripeWebhookTable = await queryRunner.getTable(
      'tb_stripe_webhook_event',
    );

    if (stripeWebhookTable) {
      await queryRunner.query('DROP TABLE `tb_stripe_webhook_event`');
    }

    const payosWebhookTable = await queryRunner.getTable(
      'tb_payos_webhook_event',
    );

    if (!payosWebhookTable) {
      await queryRunner.createTable(
        new Table({
          name: 'tb_payos_webhook_event',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
              comment: 'Primary key',
            },
            {
              name: 'payosEventKey',
              type: 'varchar',
              length: '255',
              isNullable: false,
            },
            {
              name: 'type',
              type: 'varchar',
              length: '255',
              isNullable: false,
            },
            {
              name: 'processedAt',
              type: 'timestamp',
              isNullable: false,
            },
            {
              name: 'createdAt',
              type: 'timestamp',
              precision: 6,
              isNullable: false,
              default: 'CURRENT_TIMESTAMP(6)',
              comment: 'Thoi diem tao',
            },
            {
              name: 'updatedAt',
              type: 'timestamp',
              precision: 6,
              isNullable: false,
              default: 'CURRENT_TIMESTAMP(6)',
              onUpdate: 'CURRENT_TIMESTAMP(6)',
              comment: 'Thoi diem cap nhat',
            },
            {
              name: 'deletedAt',
              type: 'timestamp',
              precision: 6,
              isNullable: true,
              comment: 'Thoi diem xoa mem',
            },
          ],
          indices: [
            new TableIndex({
              name: 'IDX_tb_payos_webhook_event_key',
              columnNames: ['payosEventKey'],
              isUnique: true,
            }),
          ],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const payosWebhookTable = await queryRunner.getTable(
      'tb_payos_webhook_event',
    );

    if (payosWebhookTable) {
      await queryRunner.query('DROP TABLE `tb_payos_webhook_event`');
    }

    const paymentTable = await queryRunner.getTable('tb_payment');

    if (paymentTable) {
      const payosOrderIndex = paymentTable.indices.find(
        (index) => index.name === 'IDX_tb_payment_payos_order',
      );

      if (payosOrderIndex) {
        await queryRunner.dropIndex('tb_payment', payosOrderIndex);
      }

      if (paymentTable.findColumnByName('qrCode')) {
        await queryRunner.dropColumn('tb_payment', 'qrCode');
      }

      if (paymentTable.findColumnByName('payosPaymentLinkId')) {
        await queryRunner.dropColumn('tb_payment', 'payosPaymentLinkId');
      }

      if (paymentTable.findColumnByName('payosOrderCode')) {
        await queryRunner.dropColumn('tb_payment', 'payosOrderCode');
      }

      if (!paymentTable.findColumnByName('stripeSessionId')) {
        await queryRunner.addColumn(
          'tb_payment',
          new TableColumn({
            name: 'stripeSessionId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          }),
        );
      }

      if (!paymentTable.findColumnByName('stripePaymentIntentId')) {
        await queryRunner.addColumn(
          'tb_payment',
          new TableColumn({
            name: 'stripePaymentIntentId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          }),
        );
      }

      await queryRunner.createIndex(
        'tb_payment',
        new TableIndex({
          name: 'IDX_tb_payment_stripe_session',
          columnNames: ['stripeSessionId'],
          isUnique: true,
        }),
      );
      await queryRunner.query(
        "UPDATE `tb_payment` SET `method` = 'stripe' WHERE `method` = 'payos'",
      );
      await queryRunner.query(
        "ALTER TABLE `tb_payment` ALTER `method` SET DEFAULT 'stripe'",
      );
    }

    const stripeWebhookTable = await queryRunner.getTable(
      'tb_stripe_webhook_event',
    );

    if (!stripeWebhookTable) {
      await queryRunner.createTable(
        new Table({
          name: 'tb_stripe_webhook_event',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
              comment: 'Primary key',
            },
            {
              name: 'stripeEventId',
              type: 'varchar',
              length: '255',
              isNullable: false,
            },
            {
              name: 'type',
              type: 'varchar',
              length: '255',
              isNullable: false,
            },
            {
              name: 'processedAt',
              type: 'timestamp',
              isNullable: false,
            },
            {
              name: 'createdAt',
              type: 'timestamp',
              precision: 6,
              isNullable: false,
              default: 'CURRENT_TIMESTAMP(6)',
              comment: 'Thoi diem tao',
            },
            {
              name: 'updatedAt',
              type: 'timestamp',
              precision: 6,
              isNullable: false,
              default: 'CURRENT_TIMESTAMP(6)',
              onUpdate: 'CURRENT_TIMESTAMP(6)',
              comment: 'Thoi diem cap nhat',
            },
            {
              name: 'deletedAt',
              type: 'timestamp',
              precision: 6,
              isNullable: true,
              comment: 'Thoi diem xoa mem',
            },
          ],
          indices: [
            new TableIndex({
              name: 'IDX_tb_stripe_webhook_event_id',
              columnNames: ['stripeEventId'],
              isUnique: true,
            }),
          ],
        }),
      );
    }
  }
}
