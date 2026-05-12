import { Controller, Post, Body, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ScannerService } from './scanner.service';
import { ScanRequestDto } from './dto/scan-request.dto';
import { ScanResponseDto } from './dto/scan-response.dto';

@ApiTags('Scanner')
@Controller('api')
export class ScannerController {
  constructor(private readonly scannerService: ScannerService) {}

  @Post('scan')
  @ApiOperation({
    summary: 'Scan a URL for security headers',
    description:
      'Fetches HTTP response headers from the target URL and analyzes them against OWASP security best practices. Returns a comprehensive security report with score, compliance mappings, and recommendations.',
  })
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: ScanRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Scan completed successfully',
    type: ScanResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid URL provided',
  })
  @ApiResponse({
    status: 502,
    description: 'Failed to reach target URL',
  })
  async scan(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    body: ScanRequestDto,
  ): Promise<ScanResponseDto> {
    return this.scannerService.scan(body.url);
  }
}
