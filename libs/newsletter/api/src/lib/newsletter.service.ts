import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Newsletter, Prisma, PrismaClient } from '@prisma/client';
import {
  DEFAULT_DOCUMENT,
  DocumentError,
  NewsletterDocument,
  parseDocument,
} from '@wepublish/newsletter';
import { getMaxTake } from '@wepublish/utils/api';
import {
  CreateNewsletterInput,
  NewsletterListArgs,
  UpdateNewsletterInput,
} from './newsletter.model';

export type ParsedNewsletter = Omit<Newsletter, 'document'> & {
  document: NewsletterDocument;
};

@Injectable()
export class NewsletterService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Re-validated on the way out as well: a document written by an older
   * build of the editor may hold a block shape this one cannot render.
   */
  private parse(newsletter: Newsletter): ParsedNewsletter {
    return { ...newsletter, document: this.validate(newsletter.document) };
  }

  private validate(document: unknown): NewsletterDocument {
    try {
      return parseDocument(document);
    } catch (error) {
      if (error instanceof DocumentError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  async list({ take = 50, skip = 0 }: NewsletterListArgs) {
    const [totalCount, rows] = await Promise.all([
      this.prisma.newsletter.count(),
      this.prisma.newsletter.findMany({
        skip,
        take: getMaxTake(take) + 1,
        orderBy: { modifiedAt: 'desc' },
      }),
    ]);

    const nodes = rows.slice(0, getMaxTake(take)).map(row => this.parse(row));

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage: Boolean(skip),
        hasNextPage: rows.length > nodes.length,
        startCursor: nodes[0]?.id,
        endCursor: nodes[nodes.length - 1]?.id,
      },
    };
  }

  async findById(id: string): Promise<ParsedNewsletter> {
    const newsletter = await this.prisma.newsletter.findUnique({
      where: { id },
    });

    if (!newsletter) {
      throw new NotFoundException(`Newsletter with id ${id} not found`);
    }

    return this.parse(newsletter);
  }

  /**
   * A new issue starts from a previous one's structure when asked to, so an
   * editor edits rather than assembles. Either source goes through
   * `parseDocument` like any other input.
   */
  async create(input: CreateNewsletterInput): Promise<ParsedNewsletter> {
    const title = input.title.trim();

    if (!title) {
      throw new BadRequestException('A newsletter needs a title');
    }

    const source =
      input.document ??
      (input.fromNewsletterId ?
        (await this.findById(input.fromNewsletterId)).document
      : DEFAULT_DOCUMENT);
    const document = this.validate(source);

    const created = await this.prisma.newsletter.create({
      data: { title, document: document as unknown as Prisma.InputJsonValue },
    });

    return this.parse(created);
  }

  async update({
    id,
    title,
    document,
  }: UpdateNewsletterInput): Promise<ParsedNewsletter> {
    await this.findById(id);

    const trimmed = title?.trim();

    if (title !== undefined && title !== null && !trimmed) {
      throw new BadRequestException('A newsletter needs a title');
    }

    const updated = await this.prisma.newsletter.update({
      where: { id },
      data: {
        ...(trimmed ? { title: trimmed } : {}),
        ...(document ?
          {
            document: this.validate(
              document
            ) as unknown as Prisma.InputJsonValue,
          }
        : {}),
      },
    });

    return this.parse(updated);
  }

  async delete(id: string): Promise<ParsedNewsletter> {
    const existing = await this.findById(id);

    await this.prisma.newsletter.delete({ where: { id } });

    return existing;
  }

  async recordCampaign(
    id: string,
    campaignId: string,
    campaignWebId: number
  ): Promise<void> {
    await this.prisma.newsletter.update({
      where: { id },
      data: {
        mailchimpCampaignId: campaignId,
        mailchimpCampaignWebId: campaignWebId,
      },
    });
  }
}
