import dataSource from '../data-source';
import { UserSeeder } from './seeders/user.seeder';
import { LocationTypeSeeder } from './seeders/location-type.seeder';
import { ServiceSeeder } from './seeders/service.seeder';
import { LocationSeeder } from './seeders/location.seeder';
import { LocationAvailabilitySeeder } from './seeders/location-availability.seeder';

async function seed() {
  const startTime = Date.now();
  console.log('========================================');
  console.log('🌱 Starting Database Seeding Process...');
  console.log('========================================\n');

  try {
    await dataSource.initialize();
    console.log('✓ Database connection initialized.\n');

    // 1. Seed Users & Profiles
    console.log('[1/5] Seeding Users and Profiles...');
    await UserSeeder.run(dataSource);
    console.log('');

    // 2. Seed Location Types
    console.log('[2/5] Seeding Location Types...');
    await LocationTypeSeeder.run(dataSource);
    console.log('');

    // 3. Seed Services
    console.log('[3/5] Seeding Services...');
    await ServiceSeeder.run(dataSource);
    console.log('');

    // 4. Seed Locations, Addresses, Media, and Location Services
    console.log('[4/5] Seeding Locations & related data...');
    await LocationSeeder.run(dataSource);
    console.log('');

    // 5. Seed Location Availabilities
    console.log('[5/5] Seeding Location Availabilities...');
    await LocationAvailabilitySeeder.run(dataSource);
    console.log('');

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('========================================');
    console.log(`🎉 Database Seeding Completed in ${duration}s!`);
    console.log('========================================');
  } catch (error) {
    console.error('\n❌ Error during database seeding:', error);
    process.exitCode = 1;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('✓ Database connection closed.');
    }
  }
}

void seed();
