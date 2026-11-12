import { z } from 'zod/v4';
import { crossField } from './cross-field';

const eventBase = z.object({
  status: z.enum(['a', 'b']),
  starts: z.date(),
  ends: z.date().nullable(),
  opens: z.string().transform(value => new Date(value)),
});

describe('crossField', () => {
  it('gives the check the output of its keys', () => {
    crossField(
      eventBase,
      ['starts', 'ends', 'opens'],
      value => {
        expectTypeOf(value).toEqualTypeOf<{
          starts: Date;
          ends: Date | null;
          opens: Date;
        }>();

        return true;
      },
      { path: ['ends'], error: 'event.endsBeforeStarts' }
    );
  });

  it('works inside a generic rules function', () => {
    const withEventRules = <S extends typeof eventBase>(schema: S) =>
      crossField(
        schema,
        ['starts', 'ends'],
        value => !value.ends || value.ends > value.starts,
        {
          path: ['ends'],
          error: 'event.endsBeforeStarts',
        }
      );

    expectTypeOf(withEventRules(eventBase)).toEqualTypeOf<typeof eventBase>();
    expectTypeOf(
      withEventRules(eventBase.extend({ name: z.string() })).shape.name
    ).toEqualTypeOf<z.ZodString>();
  });

  it('rejects unknown keys and paths', () => {
    // @ts-expect-error titel is not a key
    crossField(eventBase, ['titel'], () => true, {
      path: ['ends'],
      error: 'x',
    });
    crossField(eventBase, ['starts'], () => true, {
      // @ts-expect-error the path starts at a key
      path: ['end'],
      error: 'x',
    });
  });
});
