import { MigrationInterface, QueryRunner } from 'typeorm';

export class $npmConfigName1782415606483 implements MigrationInterface {
  name = ' $npmConfigName1782415606483';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`tb_location_availability\` DROP COLUMN \`availableCount\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`tb_location_availability\` ADD \`availableCount\` int NOT NULL DEFAULT '0'`,
    );
  }
}
