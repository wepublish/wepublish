import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LetterAddressPosition, PrismaClient } from '@prisma/client';
import { LetterContext } from '../letter-context';
import { LAYOUT_BAND_MAX_MM } from '../letter-renderer';
import {
  SAMPLE_LETTER_ADDRESS,
  SAMPLE_LETTER_BODY,
  SAMPLE_LETTER_USER,
} from '../letter-sample-data';
import {
  LetterLayoutInput,
  LetterLayoutPreviewInput,
} from './letter-layout.model';

@Injectable()
export class LetterLayoutService {
  constructor(
    private prisma: PrismaClient,
    private letterContext: LetterContext
  ) {}

  list() {
    return this.prisma.letterLayout.findMany({
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async findById(id: string) {
    const layout = await this.prisma.letterLayout.findUnique({
      where: { id },
    });

    if (!layout) {
      throw new NotFoundException(`Letter layout <${id}> not found.`);
    }

    return layout;
  }

  async create(input: LetterLayoutInput) {
    this.validate(input);

    if (!input.isDefault) {
      return this.prisma.letterLayout.create({ data: input });
    }

    // Only one layout may be the default: the new one takes over.
    return this.prisma.$transaction(async tx => {
      await tx.letterLayout.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });

      return tx.letterLayout.create({ data: input });
    });
  }

  async update(id: string, input: LetterLayoutInput) {
    this.validate(input);

    if (!input.isDefault) {
      return this.prisma.letterLayout.update({ where: { id }, data: input });
    }

    return this.prisma.$transaction(async tx => {
      await tx.letterLayout.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });

      return tx.letterLayout.update({ where: { id }, data: input });
    });
  }

  async delete(id: string) {
    const layout = await this.prisma.letterLayout.findUnique({
      where: { id },
      include: { _count: { select: { mailTemplates: true } } },
    });

    if (!layout) {
      throw new NotFoundException(`Letter layout <${id}> not found.`);
    }

    if (layout._count.mailTemplates > 0) {
      throw new BadRequestException(
        `Letter layout is still used by ${layout._count.mailTemplates} mail template(s). Unassign it first.`
      );
    }

    return this.prisma.letterLayout.delete({ where: { id } });
  }

  /**
   * A sample letter on the given stationery, long enough to run onto a second
   * page so the repeating header and footer can be checked.
   */
  async preview(input: LetterLayoutPreviewInput): Promise<{ pdf: string }> {
    this.validate(input);

    const pdf = await this.letterContext.renderLetter({
      template: { htmlContent: SAMPLE_LETTER_BODY },
      layout: input,
      addressPosition: LetterAddressPosition.left,
      data: { user: SAMPLE_LETTER_USER, optional: {}, currentDate: new Date() },
      recipient: SAMPLE_LETTER_ADDRESS,
    });

    return { pdf: pdf.toString('base64') };
  }

  private validate(input: LetterLayoutPreviewInput & { name?: string }) {
    if (input.name !== undefined && !input.name.trim()) {
      throw new BadRequestException('A letter layout needs a name.');
    }

    for (const height of [input.headerHeightMm, input.footerHeightMm]) {
      if (
        !Number.isInteger(height) ||
        height < 0 ||
        height > LAYOUT_BAND_MAX_MM
      ) {
        throw new BadRequestException(
          `Header and footer heights must be between 0 and ${LAYOUT_BAND_MAX_MM} mm.`
        );
      }
    }
  }
}
