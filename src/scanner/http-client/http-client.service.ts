import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { resolveAndCheckHostname } from '../../common/guards/ssrf.guard';

export interface HttpClientResult {
  headers: Record<string, string>;
  statusCode: number;
  responseTime: number;
}

@Injectable()
export class HttpClientService {
  private readonly logger = new Logger(HttpClientService.name);
  private readonly userAgent = 'AuditoriaWeb-Scanner/1.0 (Security Headers Analyzer)';

  constructor(private readonly httpService: HttpService) {}

  async fetch(url: string): Promise<HttpClientResult> {
    const startTime = Date.now();

    try {
      const parsedUrl = new URL(url);
      await resolveAndCheckHostname(parsedUrl.hostname);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message: (error as Error).message,
          error: 'SSRF Protection',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'User-Agent': this.userAgent,
            Accept: '*/*',
          },
          responseType: 'arraybuffer',
          decompress: true,
          validateStatus: () => true,
        }),
      );

      const responseTime = Date.now() - startTime;

      const rawHeaders: Record<string, string> = {};
      if (response.headers) {
        for (const [key, value] of Object.entries(response.headers)) {
          rawHeaders[key] = String(value);
        }
      }

      return {
        headers: rawHeaders,
        statusCode: response.status,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      if (error instanceof AxiosError) {
        const statusCode = HttpStatus.BAD_GATEWAY;
        let message: string;
        let errorCode: string;

        switch (error.code) {
          case 'ECONNABORTED':
            message = `Request to ${url} timed out`;
            errorCode = 'Gateway Timeout';
            break;
          case 'ENOTFOUND':
          case 'EAI_AGAIN':
            message = `Could not resolve hostname for ${url}`;
            errorCode = 'DNS Resolution Failed';
            break;
          case 'ECONNREFUSED':
            message = `Connection refused by ${url}`;
            errorCode = 'Connection Refused';
            break;
          case 'ECONNRESET':
            message = `Connection was reset by ${url}`;
            errorCode = 'Connection Reset';
            break;
          case 'ERR_CERT_DATE_INVALID':
          case 'CERT_HAS_EXPIRED':
            message = `SSL certificate error for ${url}`;
            errorCode = 'SSL Certificate Error';
            break;
          default:
            message = `Failed to fetch ${url}: ${error.message}`;
            errorCode = 'Fetch Error';
        }

        throw new HttpException({ statusCode, message, error: errorCode }, statusCode);
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to fetch ${url}: ${(error as Error).message}`,
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
