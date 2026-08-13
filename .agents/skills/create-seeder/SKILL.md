---
name: create-seeder
description: Use this skill when asked to create a database seed, mock data, or a new seeder class in this project.
---

# create-seeder

This skill guides the AI in creating new database seeders for the `be-datn` project using `typeorm-extension`.

## Goal
To scaffold a new seeder class file in `src/seed/` for a specific entity or domain.

## Execution Order and Naming Convention
- Prefix new seeder files with a Unix timestamp (in seconds or milliseconds) to control execution order.
- Format: `<timestamp>-<domain-name>.seeder.ts`
- Example: `1700000000-user.seeder.ts`
- All seeder files must be placed inside the `src/seed/` directory.

## Idempotency Strategy (Critical)
- All seeders **must be idempotent**. They should be safe to run multiple times on the same database without throwing duplicate entry errors.
- Always check if a record exists (using a unique key or logical identifier) before creating or saving.
- Use an Upsert logic pattern:
  ```typescript
  let record = await repository.findOne({
    where: { uniqueCode: seedData.uniqueCode },
  });

  record = await repository.save(
    repository.create({
      ...(record ?? {}),
      ...seedData,
    }),
  );
  ```

## Mock Data Generation
- Generate **manual, realistic, fixed data arrays** directly within the seeder file.
- **Do NOT** use random generators (like Faker) unless explicitly requested. Fixed, deterministic data provides a stable test and development environment.
- Create local interfaces for your seed data objects at the top of the file if it helps clarify the data structure (e.g., `interface SeedUser { ... }`).

## Seeder Class Structure Template
- The class must implement `Seeder` from `typeorm-extension`.
- Use the `run(dataSource: DataSource): Promise<void>` method.
- Obtain repositories using `dataSource.getRepository(Entity)`.

```typescript
import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
// Import your entities...

export default class DomainNameSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(YourEntity);
    
    const seedDataList = [
      // ... your realistic mock data
      { uniqueKey: 'item_1', name: 'Item 1' },
      { uniqueKey: 'item_2', name: 'Item 2' }
    ];

    for (const data of seedDataList) {
      let existingRecord = await repository.findOne({
        where: { uniqueKey: data.uniqueKey },
      });

      await repository.save(
        repository.create({
          ...(existingRecord ?? {}),
          ...data,
        }),
      );
    }
  }
}
```
