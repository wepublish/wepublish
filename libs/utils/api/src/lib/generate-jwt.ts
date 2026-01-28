import jwt, { SignOptions } from 'jsonwebtoken';

export interface GenerateJWTProps {
  id: string;
  secret: string;
  issuer?: string;
  audience?: string;
  expiresInMinutes?: number;
}

export const generateJWT = (props: GenerateJWTProps): string => {
  const jwtOptions: SignOptions = {
    issuer: props.issuer,
    audience: props.audience,
    algorithm: 'HS256',
    expiresIn: `${props.expiresInMinutes || 15}m`,
  };

  return jwt.sign({ sub: props.id }, props.secret, jwtOptions);
};
