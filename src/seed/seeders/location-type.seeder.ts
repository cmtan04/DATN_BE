import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { TBLocationType } from '@/entities/location/location_type.entity';

interface SeedLocationTypeData {
  name: string;
  code: string;
  typeUnit: string;
  canHaveMultiRoom: boolean;
}

export class LocationTypeSeeder {
  public static async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(TBLocationType);

    const typesPath = path.join(__dirname, '..', 'data', 'location-types.json');
    const typesData = JSON.parse(
      fs.readFileSync(typesPath, 'utf8'),
    ) as unknown as SeedLocationTypeData[];

    let seededCount = 0;

    for (const data of typesData) {
      const existingType = await repository.findOne({
        where: { code: data.code },
      });

      await repository.save(
        repository.create({
          ...(existingType ?? {}),
          ...data,
        }),
      );

      seededCount++;
    }

    console.log(`✓ Seeded ${seededCount} location types.`);
  }
}
