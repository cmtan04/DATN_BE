import dataSource from '../data-source';

async function unseed() {
  try {
    await dataSource.initialize();
    console.log('Database connection initialized for unseeding.');

    // Tắt kiểm tra khóa ngoại để truncate một cách an toàn
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0;');
    console.log('Disabled foreign key checks.');

    // Danh sách các bảng chứa dữ liệu mock từ LocationSeeder
    const tablesToTruncate = [
      'tb_location_availability',
      'tb_location_service',
      'tb_location_media',
      'tb_location_address',
      'tb_location_favourite',
      'tb_location',
    ];

    for (const table of tablesToTruncate) {
      await dataSource.query(`TRUNCATE TABLE \`${table}\`;`);
      console.log(`Truncated table: ${table}`);
    }

    // Bật lại kiểm tra khóa ngoại
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('Enabled foreign key checks.');

    console.log(
      'Unseeding completed successfully. Mock data has been removed.',
    );
  } catch (error) {
    console.error('Error during unseeding:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Database connection closed.');
    }
  }
}

unseed();
