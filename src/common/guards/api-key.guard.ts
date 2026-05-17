import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { SECURITY } from '../config/security.config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // If no API key is configured, allow all requests
    if (!SECURITY.API_KEY) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'] as string | undefined;

    if (!apiKey || apiKey !== SECURITY.API_KEY) {
      throw new UnauthorizedException(
        'Se requiere una API key válida en el header X-API-Key. ' +
        'Configura la variable de entorno API_KEY en el servidor.',
      );
    }

    return true;
  }
}
