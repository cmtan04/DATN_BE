import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotifications1780300000000
  implements MigrationInterface
{
  name = 'CreateNotifications1780300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('tb_notification');

    if (table) {
      return;
    }

    await queryRunner.query(`
      CREATE TABLE \`tb_notification\` (
        \`id\` int NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
        \`title\` varchar(255) NOT NULL COMMENT 'Notification title',
        \`message\` text NOT NULL COMMENT 'Notification message',
        \`userId\` int NOT NULL COMMENT 'User ID',
        \`isRead\` tinyint NOT NULL DEFAULT 0,
        \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thoi diem tao',
        \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thoi diem cap nhat',
        \`deletedAt\` timestamp(6) NULL COMMENT 'Thoi diem xoa mem',
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_tb_notification_user_read_created\` (\`userId\`, \`isRead\`, \`createdAt\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('tb_notification');

    if (!table) {
      return;
    }

    await queryRunner.query('DROP TABLE `tb_notification`');
  }
}

