import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, Observable } from 'rxjs';
import { AxiosError, AxiosHeaders, AxiosResponse } from 'axios';
import { HttpException, HttpStatus } from '@nestjs/common';
import { HttpClientService } from '../../../../src/scanner/http-client/http-client.service';

function mockAxiosResponse(
  partial: Partial<AxiosResponse>,
): Observable<AxiosResponse> {
  return of({
    data: null,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as any,
    ...partial,
  } as AxiosResponse);
}

describe('HttpClientService', () => {
  let service: HttpClientService;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(async () => {
    httpService = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
      request: jest.fn(),
    } as unknown as jest.Mocked<HttpService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HttpClientService,
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    service = module.get<HttpClientService>(HttpClientService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fetch', () => {
    const url = 'https://example.com';

    it('should successfully fetch a URL and return headers, statusCode, responseTime', async () => {
      httpService.get.mockReturnValue(mockAxiosResponse({
        status: 200,
        headers: { 'content-type': 'text/html', 'server': 'nginx' },
      }));

      const result = await service.fetch(url);

      expect(httpService.get).toHaveBeenCalledWith(url, expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': expect.any(String),
          Accept: '*/*',
        }),
      }));
      expect(result.statusCode).toBe(200);
      expect(result.headers['content-type']).toBe('text/html');
      expect(result.headers['server']).toBe('nginx');
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle null/undefined response headers gracefully', async () => {
      httpService.get.mockReturnValue(mockAxiosResponse({ status: 200, headers: null as any }));

      const result = await service.fetch(url);

      expect(result.headers).toEqual({});
      expect(result.statusCode).toBe(200);
    });

    it('should handle undefined headers gracefully', async () => {
      httpService.get.mockReturnValue(mockAxiosResponse({ status: 200, headers: undefined }));

      const result = await service.fetch(url);

      expect(result.headers).toEqual({});
    });

    it('should convert all header values to strings', async () => {
      const axiosHeaders = new AxiosHeaders();
      axiosHeaders.set('content-length', 1234);
      axiosHeaders.set('x-custom', true);
      httpService.get.mockReturnValue(mockAxiosResponse({ status: 200, headers: axiosHeaders }));

      const result = await service.fetch(url);

      expect(typeof result.headers['content-length']).toBe('string');
      expect(result.headers['content-length']).toBe('1234');
      expect(typeof result.headers['x-custom']).toBe('string');
    });

    it('should throw HttpException with Gateway Timeout for ECONNABORTED error', async () => {
      const error = new AxiosError('timeout', 'ECONNABORTED');
      httpService.get.mockReturnValue(new Observable(subscriber => subscriber.error(error)));

      await expect(service.fetch(url)).rejects.toThrow(HttpException);
      await expect(service.fetch(url)).rejects.toMatchObject({
        response: { statusCode: HttpStatus.BAD_GATEWAY, message: `Request to ${url} timed out`, error: 'Gateway Timeout' },
      });
    });

    it('should throw HttpException with DNS Resolution Failed for ENOTFOUND error', async () => {
      const error = new AxiosError('ENOTFOUND', 'ENOTFOUND');
      httpService.get.mockReturnValue(new Observable(subscriber => subscriber.error(error)));

      await expect(service.fetch(url)).rejects.toMatchObject({
        response: { statusCode: HttpStatus.BAD_GATEWAY, message: `Could not resolve hostname for ${url}`, error: 'DNS Resolution Failed' },
      });
    });

    it('should throw HttpException with DNS Resolution Failed for EAI_AGAIN error', async () => {
      const error = new AxiosError('EAI_AGAIN', 'EAI_AGAIN');
      httpService.get.mockReturnValue(new Observable(subscriber => subscriber.error(error)));

      await expect(service.fetch(url)).rejects.toMatchObject({
        response: { statusCode: HttpStatus.BAD_GATEWAY, message: `Could not resolve hostname for ${url}`, error: 'DNS Resolution Failed' },
      });
    });

    it('should throw HttpException with Connection Refused for ECONNREFUSED error', async () => {
      const error = new AxiosError('ECONNREFUSED', 'ECONNREFUSED');
      httpService.get.mockReturnValue(new Observable(subscriber => subscriber.error(error)));

      await expect(service.fetch(url)).rejects.toMatchObject({
        response: { statusCode: HttpStatus.BAD_GATEWAY, message: `Connection refused by ${url}`, error: 'Connection Refused' },
      });
    });

    it('should throw HttpException with Connection Reset for ECONNRESET error', async () => {
      const error = new AxiosError('ECONNRESET', 'ECONNRESET');
      httpService.get.mockReturnValue(new Observable(subscriber => subscriber.error(error)));

      await expect(service.fetch(url)).rejects.toMatchObject({
        response: { statusCode: HttpStatus.BAD_GATEWAY, message: `Connection was reset by ${url}`, error: 'Connection Reset' },
      });
    });

    it('should throw HttpException with SSL Certificate Error for ERR_CERT_DATE_INVALID', async () => {
      const error = new AxiosError('cert date invalid', 'ERR_CERT_DATE_INVALID');
      httpService.get.mockReturnValue(new Observable(subscriber => subscriber.error(error)));

      await expect(service.fetch(url)).rejects.toMatchObject({
        response: { statusCode: HttpStatus.BAD_GATEWAY, message: `SSL certificate error for ${url}`, error: 'SSL Certificate Error' },
      });
    });

    it('should throw HttpException with SSL Certificate Error for CERT_HAS_EXPIRED', async () => {
      const error = new AxiosError('cert expired', 'CERT_HAS_EXPIRED');
      httpService.get.mockReturnValue(new Observable(subscriber => subscriber.error(error)));

      await expect(service.fetch(url)).rejects.toMatchObject({
        response: { statusCode: HttpStatus.BAD_GATEWAY, message: `SSL certificate error for ${url}`, error: 'SSL Certificate Error' },
      });
    });

    it('should throw HttpException with Fetch Error for unknown error code', async () => {
      const error = new AxiosError('something weird', 'UNKNOWN_CODE');
      httpService.get.mockReturnValue(new Observable(subscriber => subscriber.error(error)));

      await expect(service.fetch(url)).rejects.toMatchObject({
        response: { statusCode: HttpStatus.BAD_GATEWAY, message: `Failed to fetch ${url}: something weird`, error: 'Fetch Error' },
      });
    });

    it('should throw HttpException with Internal Server Error for non-Axios errors', async () => {
      const error = new Error('Random crash');
      httpService.get.mockReturnValue(new Observable(subscriber => subscriber.error(error)));

      await expect(service.fetch(url)).rejects.toMatchObject({
        response: { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: `Failed to fetch ${url}: Random crash`, error: 'Internal Server Error' },
      });
    });
  });
});
