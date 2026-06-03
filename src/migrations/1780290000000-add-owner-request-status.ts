import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOwnerRequestStatus1780290000000
  implements MigrationInterface
{
  name = 'AddOwnerRequestStatus1780290000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const userTable = await queryRunner.getTable('tb_user_default');
    const hasOwnerRequestStatus = userTable?.columns.some(
      (column) => column.name === 'ownerRequestStatus',
    );

    if (!hasOwnerRequestStatus) {
      await queryRunner.query(`
        ALTER TABLE \`tb_user_default\`
        ADD \`ownerRequestStatus\` int NOT NULL COMMENT 'Trang thai xin lam chu phong' DEFAULT 0
      `);
    }

    await queryRunner.query(`
      UPDATE \`tb_user_default\`
      SET
        \`ownerRequestStatus\` = CASE
          WHEN \`userRole\` = 1 THEN 2
          ELSE 0
        END,
        \`isApplyingForOwner\` = 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const userTable = await queryRunner.getTable('tb_user_default');
    const hasOwnerRequestStatus = userTable?.columns.some(
      (column) => column.name === 'ownerRequestStatus',
    );

    if (hasOwnerRequestStatus) {
      await queryRunner.query(
        'ALTER TABLE `tb_user_default` DROP COLUMN `ownerRequestStatus`',
      );
    }
  }
}
