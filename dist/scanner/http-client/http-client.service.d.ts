import { HttpService } from '@nestjs/axios';
export interface HttpClientResult {
    headers: Record<string, string>;
    statusCode: number;
    responseTime: number;
}
export declare class HttpClientService {
    private readonly httpService;
    private readonly logger;
    private readonly userAgent;
    constructor(httpService: HttpService);
    fetch(url: string): Promise<HttpClientResult>;
}
