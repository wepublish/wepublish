import { createHash } from 'crypto';

/**
 * Compute a JWK Thumbprint (RFC 7638) as the key ID.
 * For EC keys: canonical JSON is {"crv":"...","kty":"EC","x":"...","y":"..."}
 */
export function computeKid(jwk: JsonWebKey): string {
  const canonical = JSON.stringify({
    crv: jwk.crv,
    kty: jwk.kty,
    x: jwk.x,
    y: jwk.y,
  });

  return createHash('sha256').update(canonical).digest('base64url');
}
