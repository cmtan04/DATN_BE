import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class SignInRequestDto {
  @ApiProperty({ example: 'owner@test.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  password: string;

  @ApiPropertyOptional({
    description: 'Remember me option',
    default: false,
    example: true,
  })
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

export class SignInResponseDto {
  message: string;
  accessToken: string;
  refreshToken?: string;
}

export class RefreshTokenRequestDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
