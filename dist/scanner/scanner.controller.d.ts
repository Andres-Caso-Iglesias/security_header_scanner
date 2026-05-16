import { Response } from 'express';
import { ScannerService } from './scanner.service';
import { ExportService } from '../report/export/export.service';
import { ScanRequestDto } from './dto/scan-request.dto';
import { ExportRequestDto } from './dto/export-request.dto';
import { ScanResponseDto } from './dto/scan-response.dto';
export declare class ScannerController {
    private readonly scannerService;
    private readonly exportService;
    constructor(scannerService: ScannerService, exportService: ExportService);
    scan(body: ScanRequestDto): Promise<ScanResponseDto>;
    scanStream(url: string): import("rxjs").Observable<{
        data: string;
    }>;
    export(body: ExportRequestDto, res: Response): Promise<void>;
}
