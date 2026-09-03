import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { TBLocation } from '@/entities/location/location.entity';
import { TBLocationAvailability } from '@/entities/location_availability.entity';

interface SeedAvailabilityData {
  locationName: string;
  date: string;
  bookedCount: number;
}

export class LocationAvailabilitySeeder {
  public static async run(dataSource: DataSource): Promise<void> {
    const locationRepository = dataSource.getRepository(TBLocation);
    const availabilityRepository = dataSource.getRepository(
      TBLocationAvailability,
    );

    const availPath = path.join(
      __dirname,
      '..',
      'data',
      'location-availabilities.json',
    );

    if (!fs.existsSync(availPath)) {
      return;
    }

    const availData = JSON.parse(
      fs.readFileSync(availPath, 'utf8'),
    ) as unknown as SeedAvailabilityData[];

    // Map location name -> locationId
    const allLocations = await locationRepository.find();
    const locationMap = new Map<string, number>();
    for (const loc of allLocations) {
      locationMap.set(loc.name, loc.id);
    }

    let seededCount = 0;

    for (const item of availData) {
      const locationId = locationMap.get(item.locationName);
      if (!locationId) {
        continue;
      }

      const dateObj = new Date(item.date);

      const existingRecord = await availabilityRepository.findOne({
        where: {
          locationId,
          date: dateObj,
        },
      });

      if (existingRecord) {
        existingRecord.bookedCount = item.bookedCount;
        await availabilityRepository.save(existingRecord);
      } else {
        await availabilityRepository.save(
          availabilityRepository.create({
            locationId,
            date: dateObj,
            bookedCount: item.bookedCount,
          }),
        );
      }

      seededCount++;
    }

    console.log(`✓ Seeded ${seededCount} location availability records.`);
  }
}
