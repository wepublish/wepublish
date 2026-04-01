import { CompactSign, compactVerify, type KeyLike } from 'jose';
import { TransformationsDto } from './transformations.dto';

const JWS_PROTECTED_HEADER = { alg: 'EdDSA' } as const;

/**
 * Base64url-encoded JWS protected header for EdDSA.
 * Pre-computed since it never changes.
 */
const JWS_HEADER_B64 = Buffer.from(
  JSON.stringify(JWS_PROTECTED_HEADER)
).toString('base64url');

/**
 * Build the signing payload from image ID and sorted transformation parameters.
 */
const buildSigningPayload = (
  imageId: string,
  transformationsKey: string
): Uint8Array => {
  return new TextEncoder().encode(`${imageId}-${transformationsKey}`);
};

/**
 * Sign image transformations with an EdDSA private key.
 * Returns only the signature portion of the JWS (deterministic for EdDSA).
 */
export const signImageTransformations = async (
  privateKey: KeyLike,
  imageId: string,
  transformations: TransformationsDto
): Promise<string> => {
  const transformationsKey = getTransformationKey(transformations);
  const payload = buildSigningPayload(imageId, transformationsKey);

  const jws = await new CompactSign(payload)
    .setProtectedHeader(JWS_PROTECTED_HEADER)
    .sign(privateKey);

  // Return only the signature part (third segment of compact JWS).
  // EdDSA is deterministic: same key + same payload = same signature every time.
  return jws.split('.')[2];
};

/**
 * Verify an image signature using an EdDSA public key.
 * Reconstructs the JWS from the signature and verifies it.
 * Throws on invalid signature.
 */
export const verifyImageSignature = async (
  publicKey: KeyLike,
  sig: string,
  imageId: string,
  transformations: TransformationsDto
): Promise<void> => {
  const transformationsKey = getTransformationKey(transformations);
  const payload = buildSigningPayload(imageId, transformationsKey);
  const payloadB64 = Buffer.from(payload).toString('base64url');

  // Reconstruct the compact JWS: header.payload.signature
  const jws = `${JWS_HEADER_B64}.${payloadB64}.${sig}`;
  await compactVerify(jws, publicKey);
};

export const removeSignatureFromTransformations = (t: TransformationsDto) => {
  const { sig, ...dataWithoutSignature } = t;
  return dataWithoutSignature;
};

export const getTransformationKey = (transformations: TransformationsDto) => {
  return JSON.stringify(transformations, (_key, value) =>
    value instanceof Object && !(value instanceof Array) ?
      Object.keys(value)
        .sort()
        .reduce(
          (sorted, key) => {
            sorted[key] = value[key];
            return sorted;
          },
          {} as Record<string, unknown>
        )
    : value
  );
};
