import { registerEnumType } from '@nestjs/graphql';
import { SellableKind } from '@prisma/client';

registerEnumType(SellableKind, {
  name: 'SellableKind',
});

export { SellableKind };
