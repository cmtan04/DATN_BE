import dataSource from '../data-source';

async function unseed() {
  const startTime = Date.now();
  console.log('========================================');
  console.log('🧹 Starting Database Unseeding Process...');
  console.log('========================================\n');

  try {
    await dataSource.initialize();
    console.log('✓ Database connection initialized.\n');

    // Tắt kiểm tra khóa ngoại để truncate an toàn
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0;');
    console.log('✓ Foreign key checks disabled.');

    // Danh sách toàn bộ các bảng trong phạm vi seed (theo thứ tự quan hệ)
    const tablesToTruncate = [
      'tb_location_availability',
      'tb_location_service',
      'tb_location_media',
      'tb_location_favourite',
      'tb_location',
      'tb_location_address',
      'tb_service',
      'tb_location_type',
      'tb_user_default',
      'tb_user_profile',
    ];

    for (const table of tablesToTruncate) {
      await dataSource.query(`TRUNCATE TABLE \`${table}\`;`);
      console.log(`  - Truncated table: ${table}`);
    }

    // Bật lại kiểm tra khóa ngoại
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('\n✓ Foreign key checks re-enabled.');

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('========================================');
    console.log(`🎉 Database Unseeding Completed in ${duration}s!`);
    console.log('========================================');
  } catch (error) {
    console.error('\n❌ Error during database unseeding:', error);
    process.exitCode = 1;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('✓ Database connection closed.');
    }
  }
}

void unseed();
