import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
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

    let payload;
    try {
      const result = await jwtVerify(token, publicKey, {
        algorithms: ['EdDSA'],
        audience: 'wepublish-media-server',
        issuer: this.jwksClient.getApiUrl(),
      });
      payload = result.payload;
    } catch (error) {
      this.logger.warn(`JWT verification failed: ${(error as Error).message}`);
      throw new UnauthorizedException('Invalid authorization token');
    }

    // Verify the token is scoped to the requested image
    const imageId = this.extractImageId(request);
    if (!payload.sub || payload.sub !== imageId) {
      throw new ForbiddenException('Token not authorized for this image');
    }

    // Verify the token action matches the request method
    const expectedAction = request.method === 'DELETE' ? 'delete' : 'upload';
    if (payload['action'] !== expectedAction) {
      throw new ForbiddenException(
        `Token not authorized for ${expectedAction}`
      );
    }

    return true;
  }

  private extractBearerToken(request: any): string | null {
    const authorization = request.headers?.authorization;
    if (!authorization) return null;

    const [type, token] = authorization.split(' ');
    if (type !== 'Bearer' || !token) return null;

    return token;
  }

  private extractImageId(request: any): string | null {
    // DELETE /v1/:imageId → params.imageId
    // POST /v1/?imageId=... → query.imageId
    // Document endpoints use documentId
    // DELETE /v1/document/:documentId → params.documentId
    // POST /v1/document?documentId=... → query.documentId
    return (
      request.params?.imageId ||
      request.query?.imageId ||
      request.params?.documentId ||
      request.query?.documentId ||
      null
    );
  }
}
