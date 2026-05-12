import { IsString, IsNotEmpty, IsUrl, IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExportRequestDto {
  @ApiProperty({
    description: 'Target URL to scan and export',
    example: 'https://example.com',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  url: string;

  @ApiProperty({
    description: 'Export format',
    example: 'pdf',
    enum: ['pdf', 'json'],
  })
  @IsString()
  @IsIn(['pdf', 'json'])
  format: string;
}
