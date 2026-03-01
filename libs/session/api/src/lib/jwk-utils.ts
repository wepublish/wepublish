import { createHash } from 'crypto';

/**
 * Compute a JWK Thumbprint (RFC 7638) as the key ID.
 * For OKP keys (Ed25519): canonical JSON is {"crv":"...","kty":"OKP","x":"..."}
 * For EC keys: canonical JSON is {"crv":"...","kty":"EC","x":"...","y":"..."}
 */
export function computeKid(jwk: JsonWebKey): string {
  const members: Record<string, unknown> =
    jwk.kty === 'OKP' ?
      { crv: jwk.crv, kty: jwk.kty, x: jwk.x }
    : { crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y };

  const canonical = JSON.stringify(members);

  return createHash('sha256').update(canonical).digest('base64url');
}
