import { z } from 'zod/v4';
import { collapseEmptyGroups } from './empty-groups';

const link = z.discriminatedUnion('type', [
  z.object({ type: z.literal('url'), url: z.string().min(1) }),
  z.object({ type: z.literal('page'), pageId: z.string().min(1) }),
]);

describe('collapseEmptyGroups', () => {
  it('collapses an optional union whose type was never picked or was taken back', () => {
    const schema = z.object({ teaser: link.nullish(), cta: link.optional() });

    expect(
      collapseEmptyGroups(schema, { teaser: { type: null }, cta: {} })
    ).toEqual({
      teaser: null,
      cta: undefined,
    });
    expect(
      collapseEmptyGroups(schema, {
        teaser: { type: undefined, url: '' },
        cta: { type: null },
      })
    ).toEqual({
      teaser: null,
      cta: undefined,
    });
  });

  it('keeps an optional union without a type that still holds a value', () => {
    const schema = z.object({ teaser: link.nullish() });

    expect(
      collapseEmptyGroups(schema, {
        teaser: { type: null, url: 'https://wepublish.ch' },
      })
    ).toEqual({
      teaser: { type: null, url: 'https://wepublish.ch' },
    });
  });

  it('never collapses a required union without a type', () => {
    const schema = z.object({ link });

    expect(collapseEmptyGroups(schema, { link: { type: null } })).toEqual({
      link: { type: null },
    });
  });
});
