import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { jwtVerify } from 'jose';
import { JwksClientService } from './jwks-client.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly jwksClient: JwksClientService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing authorization token');
    }

    let publicKey;
    try {
      publicKey = await this.jwksClient.getPublicKey();
    } catch (error) {
      this.logger.error('Failed to fetch public key from JWKS endpoint', error);
      throw new UnauthorizedException(
        'Unable to verify token: JWKS unavailable'
      );
    }

    try {
      await jwtVerify(token, publicKey, {
        algorithms: ['EdDSA'],
        audience: 'wepublish-media-server',
      });
      return true;
    } catch (error) {
      this.logger.warn(`JWT verification failed: ${(error as Error).message}`);
      throw new UnauthorizedException('Invalid authorization token');
    }
  }

  private extractBearerToken(request: any): string | null {
    const authorization = request.headers?.authorization;
    if (!authorization) return null;

    const [type, token] = authorization.split(' ');
    if (type !== 'Bearer' || !token) return null;

    return token;
  }
}
