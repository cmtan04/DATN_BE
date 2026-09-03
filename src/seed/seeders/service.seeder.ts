import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { TBService } from '@/entities/service.entity';

interface SeedServiceData {
  name: string;
}

export class ServiceSeeder {
  public static async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(TBService);

    const servicesPath = path.join(__dirname, '..', 'data', 'services.json');
    const servicesData = JSON.parse(
      fs.readFileSync(servicesPath, 'utf8'),
    ) as unknown as SeedServiceData[];

    let seededCount = 0;

    for (const data of servicesData) {
      const existingService = await repository.findOne({
        where: { name: data.name },
      });

      if (!existingService) {
        await repository.save(
          repository.create({
            name: data.name,
          }),
        );
      }

      seededCount++;
    }

    console.log(`✓ Seeded ${seededCount} services.`);
  }
}
