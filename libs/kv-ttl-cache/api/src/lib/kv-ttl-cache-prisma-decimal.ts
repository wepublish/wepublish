import { Prisma } from '@prisma/client';
import type { DecimalCodec } from './kv-ttl-cache-serializer';

export const prismaDecimalCodec: DecimalCodec = {
  isDecimal: (value): value is Prisma.Decimal =>
    Prisma.Decimal.isDecimal(value),
  fromString: value => new Prisma.Decimal(value),
};
