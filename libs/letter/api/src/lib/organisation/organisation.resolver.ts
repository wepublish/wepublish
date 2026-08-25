import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { QrBillReferenceType } from '@prisma/client';
import { CanGetSettings, CanUpdateSettings } from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import {
  OrganisationSettings,
  OrganisationSettingsInput,
} from './organisation.model';
import { OrganisationService } from './organisation.service';

@Resolver(() => OrganisationSettings)
export class OrganisationResolver {
  constructor(private organisation: OrganisationService) {}

  @Permissions(CanGetSettings)
  @Query(() => OrganisationSettings, {
    description: `The sender of every letter and the creditor of every QR bill.`,
  })
  async organisationSettings(): Promise<OrganisationSettings> {
    const settings = await this.organisation.get();

    return {
      name: settings?.name ?? undefined,
      street: settings?.street ?? undefined,
      number: settings?.number ?? undefined,
      zip: settings?.zip ?? undefined,
      city: settings?.city ?? undefined,
      country: settings?.country ?? undefined,
      iban: settings?.iban ?? undefined,
      referenceType: settings?.referenceType ?? QrBillReferenceType.QRR,
    };
  }

  @Permissions(CanUpdateSettings)
  @Mutation(() => OrganisationSettings)
  async updateOrganisationSettings(
    @Args('input') input: OrganisationSettingsInput
  ): Promise<OrganisationSettings> {
    const settings = await this.organisation.update(input);

    return {
      name: settings.name ?? undefined,
      street: settings.street ?? undefined,
      number: settings.number ?? undefined,
      zip: settings.zip ?? undefined,
      city: settings.city ?? undefined,
      country: settings.country ?? undefined,
      iban: settings.iban ?? undefined,
      referenceType: settings.referenceType,
    };
  }
}
