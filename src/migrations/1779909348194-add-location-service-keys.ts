import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLocationServiceKeys1779909348194
  implements MigrationInterface
{
  name = 'AddLocationServiceKeys1779909348194';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const locationServiceTable = await queryRunner.getTable(
      'tb_location_service',
    );

    if (locationServiceTable) {
      const hasLocationId = locationServiceTable.columns.some(
        (column) => column.name === 'locationId',
      );
      const hasServiceId = locationServiceTable.columns.some(
        (column) => column.name === 'serviceId',
      );

      if (!hasLocationId || !hasServiceId) {
        await queryRunner.query(`
          CREATE TABLE \`tb_location_service_new\` (
            \`locationId\` int NOT NULL COMMENT 'ID dia diem',
            \`serviceId\` int NOT NULL COMMENT 'ID dich vu',
            \`price\` int NULL COMMENT 'Gia',
            \`priceUnit\` varchar(50) NULL COMMENT 'Don vi tinh',
            \`isFree\` tinyint NOT NULL DEFAULT 1,
            \`isActive\` tinyint NOT NULL DEFAULT 1,
            PRIMARY KEY (\`locationId\`, \`serviceId\`)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        await queryRunner.query(`
          INSERT INTO \`tb_location_service_new\`
            (\`locationId\`, \`serviceId\`, \`price\`, \`priceUnit\`, \`isFree\`, \`isActive\`)
          SELECT 1, (@service_row := @service_row + 1), \`price\`, \`priceUnit\`, \`isFree\`, \`isActive\`
          FROM \`tb_location_service\`, (SELECT @service_row := 0) AS row_counter
        `);

        await queryRunner.query('DROP TABLE `tb_location_service`');
        await queryRunner.query(
          'RENAME TABLE `tb_location_service_new` TO `tb_location_service`',
        );
      }
    }

    const locationTypeTable = await queryRunner.getTable('tb_location_type');
    const hasCanHaveMultiRoom = locationTypeTable?.columns.some(
      (column) => column.name === 'canHaveMultiRoom',
    );

    if (!hasCanHaveMultiRoom) {
      await queryRunner.query(`
        ALTER TABLE \`tb_location_type\`
        ADD \`canHaveMultiRoom\` tinyint NOT NULL COMMENT 'Co the co nhieu phong' DEFAULT 0
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const locationTypeTable = await queryRunner.getTable('tb_location_type');
    const hasCanHaveMultiRoom = locationTypeTable?.columns.some(
      (column) => column.name === 'canHaveMultiRoom',
    );

    if (hasCanHaveMultiRoom) {
      await queryRunner.query(
        'ALTER TABLE `tb_location_type` DROP COLUMN `canHaveMultiRoom`',
      );
    }

    const locationServiceTable = await queryRunner.getTable(
      'tb_location_service',
    );
    const hasLocationId = locationServiceTable?.columns.some(
      (column) => column.name === 'locationId',
    );
    const hasServiceId = locationServiceTable?.columns.some(
      (column) => column.name === 'serviceId',
    );

    if (hasLocationId && hasServiceId) {
      await queryRunner.query(`
        CREATE TABLE \`tb_location_service_old\` (
          \`price\` int NULL COMMENT 'Gia',
          \`priceUnit\` varchar(50) NULL COMMENT 'Don vi tinh',
          \`isFree\` tinyint NOT NULL DEFAULT 1,
          \`isActive\` tinyint NOT NULL DEFAULT 1
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      await queryRunner.query(`
        INSERT INTO \`tb_location_service_old\`
          (\`price\`, \`priceUnit\`, \`isFree\`, \`isActive\`)
        SELECT \`price\`, \`priceUnit\`, \`isFree\`, \`isActive\`
        FROM \`tb_location_service\`
      `);
      await queryRunner.query('DROP TABLE `tb_location_service`');
      await queryRunner.query(
        'RENAME TABLE `tb_location_service_old` TO `tb_location_service`',
      );
    }
  }
}
