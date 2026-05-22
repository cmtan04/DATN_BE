import { MigrationInterface, QueryRunner } from 'typeorm';

export class $npmConfigName1779188949489 implements MigrationInterface {
  name = ' $npmConfigName1779188949489';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`tb_user_profile\` (\`id\` int NOT NULL AUTO_INCREMENT COMMENT 'Primary key', \`createdAt\` timestamp(6) NOT NULL COMMENT 'Thời điểm tạo' DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL COMMENT 'Thời điểm cập nhật' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL COMMENT 'Thời điểm xóa mềm', \`fullName\` varchar(255) NOT NULL COMMENT 'Họ và tên', \`avatarUrl\` varchar(255) NULL COMMENT 'URL avatar', \`coverUrl\` varchar(255) NULL COMMENT 'URL bìa', \`phoneNumber\` varchar(255) NOT NULL COMMENT 'Số điện thoại', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`tb_user_default\` (\`id\` int NOT NULL AUTO_INCREMENT COMMENT 'Primary key', \`createdAt\` timestamp(6) NOT NULL COMMENT 'Thời điểm tạo' DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL COMMENT 'Thời điểm cập nhật' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL COMMENT 'Thời điểm xóa mềm', \`userName\` varchar(255) NOT NULL COMMENT 'Tên người dùng', \`email\` varchar(255) NOT NULL COMMENT 'Email', \`password\` varchar(255) NOT NULL COMMENT 'Mật khẩu', \`userRole\` int NOT NULL COMMENT 'Vai trò', \`userProfileId\` int NULL COMMENT 'Primary key', UNIQUE INDEX \`REL_ec3683283e731cc3bf72768312\` (\`userProfileId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`tb_location_address\` (\`id\` int NOT NULL AUTO_INCREMENT COMMENT 'Primary key', \`createdAt\` timestamp(6) NOT NULL COMMENT 'Thời điểm tạo' DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL COMMENT 'Thời điểm cập nhật' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL COMMENT 'Thời điểm xóa mềm', \`fullAddress\` varchar(255) NOT NULL COMMENT 'Địa chỉ đầy đủ', \`province\` varchar(255) NOT NULL COMMENT 'Tỉnh/Thành phố', \`district\` varchar(255) NOT NULL COMMENT 'Quận/Huyện', \`country\` varchar(255) NOT NULL COMMENT 'Quốc gia', \`region\` varchar(255) NOT NULL COMMENT 'Khu vực', \`lat\` decimal(10,8) NOT NULL COMMENT 'Kinh độ', \`lng\` decimal(11,8) NOT NULL COMMENT 'Vĩ độ', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`tb_location_service\` (\`id\` int NOT NULL AUTO_INCREMENT COMMENT 'Primary key', \`createdAt\` timestamp(6) NOT NULL COMMENT 'Thời điểm tạo' DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL COMMENT 'Thời điểm cập nhật' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL COMMENT 'Thời điểm xóa mềm', \`name\` varchar(255) NOT NULL COMMENT 'Tên dịch vụ', \`price\` int NULL COMMENT 'Giá', \`priceUnit\` varchar(50) NULL COMMENT 'Đơn vị tính', \`isFree\` tinyint NOT NULL DEFAULT 1, \`isActive\` tinyint NOT NULL DEFAULT 1, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`tb_location_media\` (\`id\` int NOT NULL AUTO_INCREMENT COMMENT 'Primary key', \`createdAt\` timestamp(6) NOT NULL COMMENT 'Thời điểm tạo' DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL COMMENT 'Thời điểm cập nhật' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL COMMENT 'Thời điểm xóa mềm', \`type\` varchar(50) NOT NULL COMMENT 'Loại media (hình ảnh, video, ...)', \`url\` varchar(500) NOT NULL COMMENT 'URL của media', \`displayOrder\` int NOT NULL COMMENT 'Thứ tự hiển thị', \`locationId\` int NULL COMMENT 'Primary key', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`tb_location\` (\`id\` int NOT NULL AUTO_INCREMENT COMMENT 'Primary key', \`createdAt\` timestamp(6) NOT NULL COMMENT 'Thời điểm tạo' DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL COMMENT 'Thời điểm cập nhật' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL COMMENT 'Thời điểm xóa mềm', \`code\` varchar(255) NOT NULL COMMENT 'Mã địa điểm', \`name\` varchar(255) NOT NULL COMMENT 'Tên địa điểm', \`ownerId\` int NOT NULL COMMENT 'ID người sở hữu', \`price\` int NOT NULL COMMENT 'Giá', \`priceUnit\` varchar(50) NOT NULL COMMENT 'Đơn vị tính', \`area\` int NOT NULL COMMENT 'Diện tích', \`locationAddressId\` int NULL COMMENT 'Primary key', \`locationTypeId\` int NULL COMMENT 'Primary key', UNIQUE INDEX \`REL_9af44d011e462f330e3b923863\` (\`locationAddressId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`tb_location_type\` (\`id\` int NOT NULL AUTO_INCREMENT COMMENT 'Primary key', \`createdAt\` timestamp(6) NOT NULL COMMENT 'Thời điểm tạo' DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL COMMENT 'Thời điểm cập nhật' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL COMMENT 'Thời điểm xóa mềm', \`name\` varchar(127) NOT NULL COMMENT 'Tên loại địa điểm', \`code\` varchar(15) NOT NULL COMMENT 'Mã loại địa điểm', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`tb_location_location_service\` (\`locationId\` int NOT NULL, \`serviceId\` int NOT NULL, INDEX \`IDX_507f54e0fdd95b6a7299567ea6\` (\`locationId\`), INDEX \`IDX_b536976d502d540fa5408750cf\` (\`serviceId\`), PRIMARY KEY (\`locationId\`, \`serviceId\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tb_user_default\` ADD CONSTRAINT \`FK_ec3683283e731cc3bf72768312f\` FOREIGN KEY (\`userProfileId\`) REFERENCES \`tb_user_profile\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tb_location_media\` ADD CONSTRAINT \`FK_7114e1e1a7329de6125586c1489\` FOREIGN KEY (\`locationId\`) REFERENCES \`tb_location\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tb_location\` ADD CONSTRAINT \`FK_9af44d011e462f330e3b923863c\` FOREIGN KEY (\`locationAddressId\`) REFERENCES \`tb_location_address\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tb_location\` ADD CONSTRAINT \`FK_3a5a5e20c7175b10ae587b55c8e\` FOREIGN KEY (\`locationTypeId\`) REFERENCES \`tb_location_type\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tb_location_location_service\` ADD CONSTRAINT \`FK_507f54e0fdd95b6a7299567ea6d\` FOREIGN KEY (\`locationId\`) REFERENCES \`tb_location\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tb_location_location_service\` ADD CONSTRAINT \`FK_b536976d502d540fa5408750cf7\` FOREIGN KEY (\`serviceId\`) REFERENCES \`tb_location_service\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`tb_location_location_service\` DROP FOREIGN KEY \`FK_b536976d502d540fa5408750cf7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tb_location_location_service\` DROP FOREIGN KEY \`FK_507f54e0fdd95b6a7299567ea6d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tb_location\` DROP FOREIGN KEY \`FK_3a5a5e20c7175b10ae587b55c8e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tb_location\` DROP FOREIGN KEY \`FK_9af44d011e462f330e3b923863c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tb_location_media\` DROP FOREIGN KEY \`FK_7114e1e1a7329de6125586c1489\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tb_user_default\` DROP FOREIGN KEY \`FK_ec3683283e731cc3bf72768312f\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_b536976d502d540fa5408750cf\` ON \`tb_location_location_service\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_507f54e0fdd95b6a7299567ea6\` ON \`tb_location_location_service\``,
    );
    await queryRunner.query(`DROP TABLE \`tb_location_location_service\``);
    await queryRunner.query(`DROP TABLE \`tb_location_type\``);
    await queryRunner.query(
      `DROP INDEX \`REL_9af44d011e462f330e3b923863\` ON \`tb_location\``,
    );
    await queryRunner.query(`DROP TABLE \`tb_location\``);
    await queryRunner.query(`DROP TABLE \`tb_location_media\``);
    await queryRunner.query(`DROP TABLE \`tb_location_service\``);
    await queryRunner.query(`DROP TABLE \`tb_location_address\``);
    await queryRunner.query(
      `DROP INDEX \`REL_ec3683283e731cc3bf72768312\` ON \`tb_user_default\``,
    );
    await queryRunner.query(`DROP TABLE \`tb_user_default\``);
    await queryRunner.query(`DROP TABLE \`tb_user_profile\``);
  }
}
