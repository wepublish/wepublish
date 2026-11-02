import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SortOrder } from '@wepublish/utils/api';
import {
  createTemplateFilter,
  createTemplateOrder,
  TemplateSort,
  throwOnDuplicateName,
} from './block-template-owner';

describe('block template owners', () => {
  describe('throwOnDuplicateName', () => {
    it('should explain that the name is taken', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`name`)',
        { code: 'P2002', clientVersion: 'test' }
      );

      expect(() => throwOnDuplicateName(error, 'Template')).toThrow(
        new BadRequestException(
          'A template with the name "Template" already exists.'
        )
      );
    });

    it('should rethrow other errors', () => {
      const error = new Error('Other');

      expect(() => throwOnDuplicateName(error, 'Template')).toThrow(error);
    });
  });

  describe('createTemplateOrder', () => {
    it.each([
      [TemplateSort.CreatedAt, SortOrder.Ascending, { createdAt: 'asc' }],
      [TemplateSort.ModifiedAt, SortOrder.Descending, { modifiedAt: 'desc' }],
      [
        TemplateSort.Name,
        SortOrder.Descending,
        { blockTemplate: { name: 'desc' } },
      ],
    ])('should sort by %s %s', (sort, order, expected) => {
      expect(createTemplateOrder(sort, order)).toEqual(expected);
    });
  });

  describe('createTemplateFilter', () => {
    it('should not filter without a name', () => {
      expect(createTemplateFilter()).toEqual({});
      expect(createTemplateFilter({})).toEqual({});
    });

    it('should filter by the name of the block template', () => {
      expect(createTemplateFilter({ name: 'News' })).toEqual({
        AND: [
          {
            blockTemplate: { name: { mode: 'insensitive', contains: 'News' } },
          },
        ],
      });
    });
  });
});
