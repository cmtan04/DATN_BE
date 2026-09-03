import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class LogoutRequestDto {
  @ApiPropertyOptional({
    description:
      'Refresh token to also revoke (if user had rememberMe enabled)',
    example: 'eyJhbGciOiJIUzI1NiIs...',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
