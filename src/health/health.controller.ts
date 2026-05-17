import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HistoryService } from '../history/history.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(private readonly historyService: HistoryService) {}

  @Get()
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns the health status of the application including uptime, memory usage, and database connectivity.',
  })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  check(): {
    status: string;
    timestamp: string;
    uptime: number;
    memory: NodeJS.MemoryUsage;
    database: { status: string; path: string };
  } {
    const dbStatus = this.checkDatabase();

    return {
      status: dbStatus.status === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: dbStatus,
    };
  }

  private checkDatabase(): { status: string; path: string } {
    try {
      const dbPath = process.env.DB_PATH || 'data/scans.db';
      this.historyService.ping();
      return { status: 'connected', path: dbPath };
    } catch {
      return { status: 'disconnected', path: process.env.DB_PATH || 'data/scans.db' };
    }
  }
}
