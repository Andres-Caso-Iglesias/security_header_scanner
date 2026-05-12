import { ApiProperty } from '@nestjs/swagger';
import { HeaderResult } from '../../common/interfaces/header-checker.interface';
import { ComplianceSection, ScanMetadata } from '../../common/interfaces/scan-result.interface';

export class ScanResponseDto {
  @ApiProperty({ description: 'Scanned URL' })
  url: string;

  @ApiProperty({ description: 'Timestamp of the scan' })
  timestamp: string;

  @ApiProperty({ description: 'Overall security score (0-100)' })
  score: number;

  @ApiProperty({ description: 'Letter grade (A-F)' })
  grade: string;

  @ApiProperty({ description: 'Per-header analysis results', type: [Object] })
  headers: HeaderResult[];

  @ApiProperty({ description: 'Compliance framework mappings', type: [Object] })
  compliance: ComplianceSection[];

  @ApiProperty({ description: 'Actionable recommendations', type: [String] })
  recommendations: string[];

  @ApiProperty({ description: 'Scan metadata' })
  metadata: ScanMetadata;
}
