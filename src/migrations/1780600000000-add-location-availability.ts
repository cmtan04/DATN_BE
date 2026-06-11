import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AddLocationAvailability1780600000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const locationTable = await queryRunner.getTable('tb_location');

    if (
      locationTable &&
      !locationTable.columns.some((column) => column.name === 'maxGuestCount')
    ) {
      await queryRunner.query(
        'ALTER TABLE `tb_location` ADD COLUMN `maxGuestCount` int NOT NULL DEFAULT 1 COMMENT \'So luong khach toi da\' AFTER `area`',
      );
    }

    const availabilityTable = await queryRunner.getTable(
      'tb_location_availability',
    );

    if (!availabilityTable) {
      await queryRunner.createTable(
        new Table({
          name: 'tb_location_availability',
          columns: [
            {
              name: 'locationId',
              type: 'int',
              isNullable: false,
              comment: 'ID dia diem',
              isPrimary: true,
            },
            {
              name: 'date',
              type: 'date',
              isNullable: false,
              comment: 'Ngay availability',
              isPrimary: true,
            },
            {
              name: 'bookedCount',
              type: 'int',
              isNullable: false,
              default: '0',
              comment: 'So phong da duoc dat',
            },
          ],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const availabilityTable = await queryRunner.getTable(
      'tb_location_availability',
    );

    if (availabilityTable) {
      await queryRunner.dropTable('tb_location_availability');
    }
  }
}
