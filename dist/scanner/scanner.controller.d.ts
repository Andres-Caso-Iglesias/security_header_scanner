import { ScannerService } from './scanner.service';
import { ScanRequestDto } from './dto/scan-request.dto';
import { ScanResponseDto } from './dto/scan-response.dto';
export declare class ScannerController {
    private readonly scannerService;
    constructor(scannerService: ScannerService);
    scan(body: ScanRequestDto): Promise<ScanResponseDto>;
}
