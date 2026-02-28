import jwt, { SignOptions } from 'jsonwebtoken';

export interface GenerateJWTProps {
  id: string;
  privateKey: string;
  issuer?: string;
  audience?: string;
  expiresInMinutes?: number;
  kid?: string;
}

export const generateJWT = (props: GenerateJWTProps): string => {
  const jwtOptions: SignOptions = {
    issuer: props.issuer,
    audience: props.audience,
    algorithm: 'ES256',
    expiresIn: `${props.expiresInMinutes || 15}m`,
    ...(props.kid && { keyid: props.kid }),
  };

  return jwt.sign({ sub: props.id }, props.privateKey, jwtOptions);
};
