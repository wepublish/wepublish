export interface AudienceJwtService {
  generateJWT(props: {
    id: string;
    audience: string;
    expiresInMinutes: number;
  }): Promise<string>;
  verifyJWT(token: string, audience: string): Promise<string>;
}

export const AUDIENCE_JWT_SERVICE = Symbol('AUDIENCE_JWT_SERVICE');
