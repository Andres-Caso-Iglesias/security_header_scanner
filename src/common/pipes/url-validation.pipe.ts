import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

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

      if (
        url.hostname !== 'localhost' &&
        url.hostname !== '127.0.0.1' &&
        !url.hostname.includes('.')
      ) {
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
