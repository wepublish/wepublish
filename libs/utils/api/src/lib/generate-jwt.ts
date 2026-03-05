import { SignJWT, importPKCS8 } from 'jose';

export interface GenerateJWTProps {
  id: string;
  privateKey: string;
  issuer?: string;
  audience?: string;
  expiresInMinutes?: number;
  kid?: string;
}

export const generateJWT = async (props: GenerateJWTProps): Promise<string> => {
  const key = await importPKCS8(props.privateKey, 'EdDSA');

  const jwt = new SignJWT({ sub: props.id })
    .setProtectedHeader({
      alg: 'EdDSA',
      ...(props.kid && { kid: props.kid }),
    })
    .setExpirationTime(`${props.expiresInMinutes || 15}m`);

  if (props.issuer) jwt.setIssuer(props.issuer);
  if (props.audience) jwt.setAudience(props.audience);

  return jwt.sign(key);
};
