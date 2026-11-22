import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  CreateSavedAudienceFilterInput,
  UpdateSavedAudienceFilterInput,
} from './saved-audience-filter.model';

const UNIQUE_VIOLATION = 'P2002';
const RECORD_NOT_FOUND = 'P2025';

const codeOf = (error: unknown) => (error as { code?: string } | null)?.code;

/**
 * Recipient filters kept under a name. The audience is stored as the editor
 * built it and handed back whole; nothing here resolves it.
 */
@Injectable()
export class SavedAudienceFilterService {
  constructor(private prisma: PrismaClient) {}

  list() {
    return this.prisma.savedAudienceFilter.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(input: CreateSavedAudienceFilterInput, createdByUserId: string) {
    try {
      return await this.prisma.savedAudienceFilter.create({
        data: {
          name: this.nameOf(input.name),
          description: this.descriptionOf(input.description),
          audience: input.audience as unknown as Prisma.InputJsonValue,
          createdByUserId,
        },
      });
    } catch (error) {
      throw this.explain(error, input.name);
    }
  }

  async update(id: string, input: UpdateSavedAudienceFilterInput) {
    const data: Prisma.SavedAudienceFilterUpdateInput = {};

    if (input.name != null) {
      data.name = this.nameOf(input.name);
    }

    if (input.description != null) {
      data.description = this.descriptionOf(input.description);
    }

    if (input.audience) {
      data.audience = input.audience as unknown as Prisma.InputJsonValue;
    }

    try {
      return await this.prisma.savedAudienceFilter.update({
        where: { id },
        data,
      });
    } catch (error) {
      throw this.explain(error, input.name ?? '', id);
    }
  }

  async delete(id: string) {
    try {
      return await this.prisma.savedAudienceFilter.delete({ where: { id } });
    } catch (error) {
      throw this.explain(error, '', id);
    }
  }

  private nameOf(name: string): string {
    const trimmed = name.trim();

    if (!trimmed) {
      throw new BadRequestException('A saved filter needs a name.');
    }

    return trimmed;
  }

  private descriptionOf(description?: string | null): string | null {
    return description?.trim() || null;
  }

  /** The database's refusals in words an editor can act on. */
  private explain(error: unknown, name: string, id?: string): unknown {
    if (codeOf(error) === UNIQUE_VIOLATION) {
      return new ConflictException(
        `A saved filter named "${name.trim()}" exists already.`
      );
    }

    if (codeOf(error) === RECORD_NOT_FOUND) {
      return new NotFoundException(`Saved filter <${id}> not found.`);
    }

    return error;
  }
}
