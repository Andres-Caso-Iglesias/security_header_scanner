import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { isPrivateIp, isBlockedHostname } from '../guards/ssrf.guard';

@Injectable()
export class UrlValidationPipe implements PipeTransform<string> {
  private readonly allowedProtocols = ['http:', 'https:'];
  private readonly maxUrlLength = 2048;

  transform(value: string): string {
    if (!value) {
      throw new BadRequestException('URL is required');
    }

    if (value.length > this.maxUrlLength) {
      throw new BadRequestException(`URL must not exceed ${this.maxUrlLength} characters`);
    }

    try {
      const url = new URL(value);

      if (!this.allowedProtocols.includes(url.protocol)) {
        throw new BadRequestException('Only HTTP and HTTPS URLs are allowed');
      }

      if (!url.hostname) {
        throw new BadRequestException('URL must have a valid hostname');
      }

      if (isBlockedHostname(url.hostname)) {
        throw new BadRequestException(`Access to ${url.hostname} is not allowed`);
      }

      if (isPrivateIp(url.hostname)) {
        throw new BadRequestException(`Access to private IP address ${url.hostname} is not allowed`);
      }

      if (!url.hostname.includes('.')) {
        throw new BadRequestException('URL must be a fully qualified domain name');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid URL format');
    }

    return value;
  }
}
