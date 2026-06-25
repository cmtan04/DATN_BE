import { Trim } from '@/common/validators/validators';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
export class ChangePasswordDto {
  @ApiProperty()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  currentPassword: string;

  @ApiProperty()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  newPassword: string;
}
