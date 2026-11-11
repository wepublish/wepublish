import { SettingName } from '@wepublish/editor/api';
import { z } from 'zod/v4';

import { formView } from './form-view';
import { uniqueConstraint } from './unique-constraint';

const schema = z.object({
  name: z.string().min(1).meta({ label: 'demo.name' }),
  slug: z.string().meta({ label: 'demo.slug' }),
  seo: z.object({ title: z.string(), description: z.string() }),
  links: z.array(z.object({ label: z.string(), url: z.string() })),
  visible: z.boolean(),
  days: z.number(),
});

const settingsSchema = z.object({
  [SettingName.AllowGuestCommenting]: z.boolean(),
  [SettingName.SessionTtlDays]: z.int().min(1),
});

describe('formView', () => {
  it('accepts paths, rows, toggle groups, covers and Dynamic hidden', () => {
    formView(schema, {
      sections: [
        { title: 'demo.details', fields: ['name', ['slug', 'days']] },
        { fields: [{ group: ['visible'], title: 'demo.flags' }] },
        { hidden: ({ visible }) => !visible, fields: ['seo.title'] },
        { component: () => null, covers: ['seo.description', 'links'] },
      ],
      fields: {
        days: { props: { unit: 'form.units.days' } },
        'links.*': { layout: () => null },
      },
      serverErrors: [
        { match: uniqueConstraint('slug'), path: 'slug', error: 'demo.taken' },
      ],
    });
  });

  it('accepts enum computed keys', () => {
    formView(settingsSchema, {
      sections: [
        {
          fields: [
            { group: [SettingName.AllowGuestCommenting] },
            SettingName.SessionTtlDays,
          ],
        },
      ],
      fields: {
        [SettingName.SessionTtlDays]: { props: { unit: 'form.units.days' } },
      },
    });
  });

  it('rejects misspelled paths in sections, rows, groups and covers', () => {
    formView(schema, {
      sections: [
        {
          fields: [
            // @ts-expect-error nmae is not a path of the schema
            'nmae',
            // @ts-expect-error a row member must be a path of the schema
            ['name', 'slg'],
            // @ts-expect-error a toggle group member must be a path of the schema
            { group: ['visibel'] },
          ],
        },
        {
          component: () => null,
          // @ts-expect-error covers lists paths of the schema
          covers: ['seo.titel'],
        },
      ],
    });
  });

  it('rejects item paths, which only the array renders', () => {
    formView(schema, {
      sections: [
        {
          fields: [
            // @ts-expect-error an item path is rendered by its array
            'links.*.label',
          ],
        },
      ],
    });
  });

  it('accepts the cards layout with full-width cards', () => {
    formView(schema, {
      layout: 'cards',
      sections: [
        { title: 'demo.details', fields: ['name', 'slug', 'days'] },
        {
          title: 'demo.more',
          span: 'full',
          collapsible: 'closed',
          hidden: ({ visible }) => !visible,
          fields: ['seo', 'links', 'visible'],
        },
      ],
    });
  });

  it('rejects an aside in the cards layout', () => {
    formView(schema, {
      layout: 'cards',
      sections: [
        { fields: ['name', 'slug', 'seo', 'links', 'days'] },
        {
          // @ts-expect-error the cards layout has no aside
          placement: 'aside',
          fields: ['visible'],
        },
      ],
    });
  });

  it('rejects a span outside the cards layout', () => {
    formView(schema, {
      sections: [
        { fields: ['name', 'slug', 'seo', 'links', 'days'] },
        {
          // @ts-expect-error only cards span the grid
          span: 'full',
          fields: ['visible'],
        },
      ],
    });
  });

  it('rejects a server error rule on a misspelled path', () => {
    formView(schema, {
      sections: [{ fields: ['name'] }],
      serverErrors: [
        {
          match: uniqueConstraint('slug'),
          // @ts-expect-error the rule must name a path of the schema
          path: 'slgu',
          error: 'demo.taken',
        },
      ],
    });
  });

  it('rejects props the component does not take', () => {
    formView(schema, {
      sections: [{ fields: ['name'] }],
      fields: {
        // @ts-expect-error NumberField has no rows prop
        days: { props: { rows: 3 } },
      },
    });
  });
});
