import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
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
  url: string;
  target: string;
  icon: string | null;
};

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

  @PrimeDataLoader(ExternalAppsDataloaderService, 'id')
  async createExternalApp(
    input: CreateExternalAppInput
  ): Promise<ExternalApps> {
    const returnValue = await this.prisma.externalApps.create({
      data: input,
    });
    return returnValue;
  }

  @PrimeDataLoader(ExternalAppsDataloaderService, 'id')
  async updateExternalApp(
    input: UpdateExternalAppInput
  ): Promise<ExternalApps> {
    const { id, ...updateData } = input;

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
