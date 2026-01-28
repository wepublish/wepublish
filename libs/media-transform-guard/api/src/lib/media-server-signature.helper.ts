import * as crypto from 'crypto';
import { TransformationsDto } from './transformations.dto';
import { timingSafeEqual } from 'crypto';

const TOKEN = process.env['MEDIA_SERVER_TOKEN'] || process.env['TOKEN'];

if (!TOKEN) {
  throw new Error('MEDIA_SERVER_TOKEN missing');
}

const KEY = Buffer.from(TOKEN, 'base64');

export const getSignatureForImage = (
  imageId: string,
  transformations: TransformationsDto
) => {
  const transformationsKeys = getTransformationKey(transformations);
  return crypto
    .createHmac('sha256', KEY)
    .update(`${imageId}-${transformationsKeys}`)
    .digest('base64url');
};

export const timeConstantCompare = (a: string, b: string): boolean => {
  try {
    return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
  } catch {
    return false;
  }
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
