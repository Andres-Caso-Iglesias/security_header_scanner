import { Controller, Post, Get, Body, ValidationPipe, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ScannerService } from './scanner.service';
import { ExportService } from '../report/export/export.service';
import { ScanRequestDto } from './dto/scan-request.dto';
import { ExportRequestDto } from './dto/export-request.dto';
import { ScanResponseDto } from './dto/scan-response.dto';

@ApiTags('Scanner')
@Controller('api')
export class ScannerController {
  constructor(
    private readonly scannerService: ScannerService,
    private readonly exportService: ExportService,
  ) {}

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

  @Post('export')
  @ApiOperation({
    summary: 'Scan a URL and export the report as PDF or JSON',
    description:
      'Performs a full security scan and returns the report as a downloadable file in the requested format (PDF or JSON).',
  })
  @ApiBody({ type: ExportRequestDto })
  @ApiResponse({
    status: 200,
    description: 'File downloaded successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid URL or format provided',
  })
  @ApiResponse({
    status: 502,
    description: 'Failed to reach target URL',
  })
  async export(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    body: ExportRequestDto,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.scannerService.scan(body.url);
    const sanitizedUrl = body.url.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40);
    const timestamp = new Date().toISOString().slice(0, 10);

    res.status(HttpStatus.OK);

    if (body.format === 'json') {
      const json = this.exportService.generateJson(result);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="auditoria-${sanitizedUrl}-${timestamp}.json"`);
      res.send(json);
    } else {
      const pdfBuffer = await this.exportService.generatePdf(result);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="auditoria-${sanitizedUrl}-${timestamp}.pdf"`);
      res.send(pdfBuffer);
    }
  }
}
