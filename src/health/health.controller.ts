import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  @Get()
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns the health status of the application including uptime and memory usage.',
  })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  check(): { status: string; timestamp: string; uptime: number; memory: NodeJS.MemoryUsage } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
}
