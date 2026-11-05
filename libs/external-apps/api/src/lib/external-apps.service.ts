import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApiToken, PrismaClient } from '@prisma/client';
import { CanGetAllApiTokens, CanGetApiTokens } from '@wepublish/permissions';
import { hasPermission } from '@wepublish/permissions/api';
import {
  CreateExternalAppInput,
  UpdateExternalAppInput,
  ExternalAppFilter,
} from './external-apps.model';
import { PrimeDataLoader } from '@wepublish/utils/api';
import { ExternalAppsDataloaderService } from './external-apps-dataloader.service';

type ExternalApps = {
  id: string;
  createdAt: Date;
  modifiedAt: Date;
  name: string;
  description: string | null;
  url: string;
  target: string;
  icon: string | null;
  apiTokenId: string | null;
};

/** Who reads or links an api key, as in the api keys list. */
export type ApiTokenReader = {
  userId?: string;
  permissions: string[];
};

const canSeeApiToken = (
  apiToken: Pick<ApiToken, 'createdById'>,
  { userId, permissions }: ApiTokenReader
) =>
  hasPermission(CanGetAllApiTokens, permissions) ||
  (hasPermission(CanGetApiTokens, permissions) &&
    !!userId &&
    apiToken.createdById === userId);

@Injectable()
export class ExternalAppsService {
  constructor(private prisma: PrismaClient) {}

  @PrimeDataLoader(ExternalAppsDataloaderService, 'id')
  async externalAppsList(filter?: ExternalAppFilter): Promise<ExternalApps[]> {
    const data = await this.prisma.externalApps.findMany({
      where: filter,
      orderBy: {
        createdAt: 'desc',
      },
    });
    return data;
  }

  @PrimeDataLoader(ExternalAppsDataloaderService, 'id')
  async externalApp(id: string): Promise<ExternalApps> {
    const data = await this.prisma.externalApps.findUnique({
      where: { id },
    });

    if (!data) {
      throw new NotFoundException(`External App with id ${id} not found`);
    }

    return data;
  }

  /** The linked api key, if the reader may see it. */
  async linkedApiToken(
    { apiTokenId }: Pick<ExternalApps, 'apiTokenId'>,
    reader: ApiTokenReader
  ): Promise<ApiToken | null> {
    if (!apiTokenId) {
      return null;
    }

    const apiToken = await this.prisma.apiToken.findUnique({
      where: { id: apiTokenId },
    });

    return apiToken && canSeeApiToken(apiToken, reader) ? apiToken : null;
  }

  /** Only a key the editor may see, and that still works, can be linked. */
  private async assertLinkableApiToken(
    apiTokenId: string,
    reader: ApiTokenReader
  ) {
    const apiToken = await this.prisma.apiToken.findUnique({
      where: { id: apiTokenId },
    });

    if (!apiToken || !canSeeApiToken(apiToken, reader)) {
      throw new BadRequestException(`API key ${apiTokenId} not found`);
    }

    if (apiToken.revokedAt) {
      throw new BadRequestException(
        `API key ${apiToken.name} has been revoked`
      );
    }

    if (apiToken.expiresAt <= new Date()) {
      throw new BadRequestException(`API key ${apiToken.name} has expired`);
    }
  }

  @PrimeDataLoader(ExternalAppsDataloaderService, 'id')
  async createExternalApp(
    input: CreateExternalAppInput,
    reader: ApiTokenReader
  ): Promise<ExternalApps> {
    if (input.apiTokenId) {
      await this.assertLinkableApiToken(input.apiTokenId, reader);
    }

    const returnValue = await this.prisma.externalApps.create({
      data: input,
    });
    return returnValue;
  }

  @PrimeDataLoader(ExternalAppsDataloaderService, 'id')
  async updateExternalApp(
    input: UpdateExternalAppInput,
    reader: ApiTokenReader
  ): Promise<ExternalApps> {
    const { id, ...updateData } = input;

    if (updateData.apiTokenId) {
      await this.assertLinkableApiToken(updateData.apiTokenId, reader);
    }

    const existingApp = await this.prisma.externalApps.findUnique({
      where: { id },
    });

    if (!existingApp) {
      throw new NotFoundException(`External App with id ${id} not found`);
    }

    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );
    const returnValue = await this.prisma.externalApps.update({
      where: { id },
      data: filteredUpdateData,
    });
    return returnValue;
  }

  @PrimeDataLoader(ExternalAppsDataloaderService, 'id')
  async deleteExternalApp(id: string): Promise<ExternalApps> {
    const existingApp = await this.prisma.externalApps.findUnique({
      where: { id },
    });

    if (!existingApp) {
      throw new NotFoundException(`External App with id ${id} not found`);
    }

    const returnValue = await this.prisma.externalApps.delete({
      where: { id },
    });
    return returnValue;
  }
}
