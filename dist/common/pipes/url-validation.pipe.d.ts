import { PipeTransform } from '@nestjs/common';
export declare class UrlValidationPipe implements PipeTransform<string> {
    private readonly allowedProtocols;
    private readonly maxUrlLength;
    transform(value: string): string;
}
