import { Prisma } from '@prisma/client';

export type CreateUserInput = Prisma.UserUncheckedCreateInput &
  Partial<{
    properties: Prisma.MetadataPropertyUncheckedCreateWithoutUserInput[];
    address: Prisma.UserAddressUncheckedCreateWithoutUserInput | null;
  }>;
