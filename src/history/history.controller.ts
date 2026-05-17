import { Controller, Get, Delete, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { HistoryService } from './history.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@ApiTags('History')
@UseGuards(ApiKeyGuard)
@Controller('api/history')
export class HistoryController {
  constructor(private readonly history: HistoryService) {}

  @Get()
  @ApiOperation({ summary: 'List recent scans' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  list(@Query('limit') limit?: number, @Query('offset') offset?: number) {
    return this.history.list(limit ? Math.min(limit, 100) : 20, offset || 0);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific scan result' })
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.history.getById(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a scan from history' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return { deleted: this.history.delete(id) };
  }

  @Delete()
  @ApiOperation({ summary: 'Clear all scan history' })
  clearAll() {
    return { deleted: this.history.deleteAll() };
  }
}
