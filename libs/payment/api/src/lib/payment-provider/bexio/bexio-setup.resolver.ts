import { Args, Field, Int, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { PaymentProviderType, PrismaClient } from '@prisma/client';
import { CanUpdatePaymentProviderSettings } from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import { SecretCrypto } from '@wepublish/settings/api';
import {
  bexioFetcher,
  BexioSetupOptions as Options,
  fetchBexioSetupOptions,
} from './bexio-setup-options';

@ObjectType()
export class BexioSetupOption {
  @Field(() => Int)
  id!: number;

  @Field()
  label!: string;
}

@ObjectType({
  description:
    'What a bexio integration can be set to, read from bexio with its token.',
})
export class BexioSetupOptions {
  @Field(() => [BexioSetupOption])
  accounts!: BexioSetupOption[];

  @Field(() => [BexioSetupOption])
  taxes!: BexioSetupOption[];

  @Field(() => [BexioSetupOption])
  units!: BexioSetupOption[];

  @Field(() => [BexioSetupOption])
  users!: BexioSetupOption[];

  @Field(() => [BexioSetupOption])
  countries!: BexioSetupOption[];
}

/** Loads the choices for a bexio integration with the token saved on it. */
export async function loadBexioSetupOptions(
  prisma: PrismaClient,
  id: string,
  fetcherFor: (
    apiKey: string
  ) => (path: string) => Promise<unknown> = bexioFetcher
): Promise<Options> {
  const setting = await prisma.settingPaymentProvider.findUnique({
    where: { id },
  });

  if (!setting || setting.type !== PaymentProviderType.BEXIO) {
    throw new Error(`Payment provider ${id} is not a bexio integration.`);
  }

  if (!setting.apiKey) {
    throw new Error('Save the bexio API token first.');
  }

  return fetchBexioSetupOptions(
    fetcherFor(new SecretCrypto().decrypt(setting.apiKey))
  );
}

@Resolver()
export class BexioSetupResolver {
  constructor(private readonly prisma: PrismaClient) {}

  @Permissions(CanUpdatePaymentProviderSettings)
  @Query(() => BexioSetupOptions, {
    description:
      'The accounts, taxes, units, users and countries of the bexio company behind a bexio integration, to choose from instead of typing ids.',
  })
  bexioSetupOptions(@Args('id') id: string): Promise<Options> {
    return loadBexioSetupOptions(this.prisma, id);
  }
}
