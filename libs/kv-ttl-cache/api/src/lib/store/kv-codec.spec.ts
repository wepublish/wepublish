import { Prisma } from '@prisma/client';
import { prismaDecimalCodec } from '../kv-ttl-cache-prisma-decimal';
import { createKvCodec } from './kv-codec';

describe('createKvCodec', () => {
  it('keeps dates and hands out a new copy on every decode', () => {
    const codec = createKvCodec();
    const value = { expiresAt: new Date('2030-01-01T00:00:00.000Z') };
    const text = codec.encode(value) as string;

    const first = codec.decode<typeof value>(text);
    const second = codec.decode<typeof value>(text);

    expect(first?.expiresAt).toBeInstanceOf(Date);
    expect(first).toEqual(value);
    expect(first).not.toBe(second);
  });

  it('keeps decimals of cached payment provider settings usable', () => {
    const codec = createKvCodec(prismaDecimalCodec);
    const text = codec.encode({
      payrexx_vatrate: new Prisma.Decimal('0.081'),
    }) as string;

    const first = codec.decode<{ payrexx_vatrate: Prisma.Decimal }>(text);
    const second = codec.decode<{ payrexx_vatrate: Prisma.Decimal }>(text);

    expect(first?.payrexx_vatrate.toNumber()).toBe(0.081);
    expect(second?.payrexx_vatrate.toNumber()).toBe(0.081);
  });

  it('cannot encode a BigInt', () => {
    expect(createKvCodec().encode({ views: BigInt(1) })).toBeUndefined();
  });

  it('cannot decode text that is not JSON', () => {
    expect(createKvCodec().decode('{not json')).toBeUndefined();
  });
});
