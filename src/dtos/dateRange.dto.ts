import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, MinDate } from 'class-validator';
import { IsAfter } from '@/common/validators/validators';

export class DateRangeDto {
  @ApiProperty({ description: 'Ngay bat dau', example: '2030-01-31' })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  @MinDate(new Date(), {
    message: 'Ngay dat phong phai bat dau tu ngay hom nay',
  })
  startDate: Date;

  @ApiProperty({ description: 'Ngay ket thuc', example: '2030-02-01' })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  @IsAfter('startDate', { message: 'Ngay ket thuc phai sau ngay bat dau' })
  endDate: Date;
}
