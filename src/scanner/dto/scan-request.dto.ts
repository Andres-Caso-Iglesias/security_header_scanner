import { IsString, IsNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ScanRequestDto {
  @ApiProperty({
    description: 'Target URL to scan for security headers',
    example: 'https://example.com',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  url: string;
}
