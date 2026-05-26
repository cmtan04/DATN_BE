import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLocationListColumns1779450000000 implements MigrationInterface {
  name = 'AddLocationListColumns1779450000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.addColumnIfMissing(
      queryRunner,
      'tb_location',
      new TableColumn({
        name: 'locationAddressId',
        type: 'int',
        isNullable: true,
        comment: 'Primary key',
      }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'tb_location',
      new TableColumn({
        name: 'locationTypeId',
        type: 'int',
        isNullable: true,
        comment: 'Primary key',
      }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'tb_location',
      new TableColumn({
        name: 'averageRating',
        type: 'decimal',
        precision: 3,
        scale: 2,
        isNullable: false,
        default: 0,
        comment: 'Diem danh gia trung binh',
      }),
    );
    await this.addColumnIfMissing(
      queryRunner,
      'tb_location_media',
      new TableColumn({
        name: 'locationId',
        type: 'int',
        isNullable: true,
        comment: 'Primary key',
      }),
    );
  }

  public down(queryRunner: QueryRunner): Promise<void> {
    void queryRunner;

    return Promise.resolve();
  }

  private async addColumnIfMissing(
    queryRunner: QueryRunner,
    tableName: string,
    column: TableColumn,
  ): Promise<void> {
    const hasColumn = await queryRunner.hasColumn(tableName, column.name);
    if (!hasColumn) {
      await queryRunner.addColumn(tableName, column);
    }
  }
}
