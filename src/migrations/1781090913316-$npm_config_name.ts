import { MigrationInterface, QueryRunner } from 'typeorm';

export class NopLocationAvailability1781090913316
  implements MigrationInterface
{
  name = 'NopLocationAvailability1781090913316';

  public async up(_queryRunner: QueryRunner): Promise<void> {}

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
