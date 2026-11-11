import { z } from 'zod/v4';

import { editorForm } from '../editor-form';
import { formFields } from '../form-fields';
import { formView } from './form-view';

const schema = z.object({
  name: z.string().min(1).meta({ label: 'demo.name' }),
  slug: z.string().meta({ label: 'demo.slug' }),
  seo: z.object({
    title: z.string().meta({ label: 'demo.seoTitle' }),
    description: z.string().meta({ label: 'demo.seoDescription' }),
  }),
  body: formFields.richText().nullish().meta({ label: 'demo.body' }),
});

function Extra() {
  return null;
}

describe('formView', () => {
  it('keeps the schema and the configuration', () => {
    const sections = [
      { title: 'demo.details', fields: ['name', 'slug'] as const },
      { fields: ['seo', 'body'] as const },
    ];
    const view = formView(schema, {
      sections,
      paths: { list: '/demo', edit: id => `/demo/edit/${id}` },
    });

    expect(view.schema).toBe(schema);
    expect(view.sections).toBe(sections);
    expect(view.paths?.edit('1')).toBe('/demo/edit/1');
  });

  it('renders with the cached Field of the schema', () => {
    const view = formView(schema, {
      sections: [{ fields: ['name', 'slug', 'seo', 'body'] }],
    });

    expect(view.Field).toBe(editorForm.fieldsFor(schema).Field);
  });

  it('throws when a top-level key is not placed in any section', () => {
    expect(() =>
      formView(schema, { sections: [{ fields: ['name', 'slug', 'body'] }] })
    ).toThrow('"seo"');
  });

  it('throws when a key is placed twice', () => {
    expect(() =>
      formView(schema, {
        sections: [
          { fields: ['name', 'slug', 'seo', 'body'] },
          { fields: ['name'] },
        ],
      })
    ).toThrow('"name"');
  });

  it('counts nested paths for their top-level key', () => {
    expect(() =>
      formView(schema, {
        sections: [
          { fields: ['name', 'slug', 'body'] },
          { title: 'demo.seo', fields: ['seo.title', 'seo.description'] },
        ],
      })
    ).not.toThrow();
    expect(() =>
      formView(schema, {
        sections: [
          { fields: ['name', 'slug', 'body', 'seo'] },
          { fields: ['seo.title'] },
        ],
      })
    ).toThrow('"seo"');
  });

  it('counts rows, toggle groups and the paths a section component covers', () => {
    expect(() =>
      formView(schema, {
        sections: [
          { fields: [['name', 'slug'], { group: ['body'] }] },
          { component: Extra, covers: ['seo'] },
        ],
      })
    ).not.toThrow();
  });

  it('throws for a collapsible section without a title', () => {
    expect(() =>
      formView(schema, {
        sections: [
          { fields: ['name', 'slug', 'body'] },
          { collapsible: 'closed', fields: ['seo'] },
        ],
      })
    ).toThrow('collapsible');
  });

  it('keeps the cards layout and the span of a card', () => {
    const view = formView(schema.omit({ body: true }), {
      layout: 'cards',
      sections: [
        { title: 'demo.details', fields: ['name', 'slug'] },
        { title: 'demo.seo', span: 'full', fields: ['seo'] },
      ],
    });

    expect(view.layout).toBe('cards');
    expect(view.sections[1].span).toBe('full');
  });

  it('throws for an aside section in the cards layout', () => {
    expect(() =>
      formView(schema.omit({ body: true }), {
        layout: 'cards',
        sections: [
          { fields: ['name', 'slug'] },
          { placement: 'aside', fields: ['seo'] } as never,
        ],
      })
    ).toThrow('cards layout has no aside');
  });

  it('throws for a span outside the cards layout', () => {
    expect(() =>
      formView(schema, {
        sections: [
          { fields: ['name', 'slug', 'body'] },
          { span: 'full', fields: ['seo'] } as never,
        ],
      })
    ).toThrow('span: "full"');
  });

  it('throws for rich text in the cards layout', () => {
    expect(() =>
      formView(schema, {
        layout: 'cards',
        sections: [
          { fields: ['name', 'slug', 'seo'] },
          { title: 'demo.body', fields: ['body'] },
        ],
      })
    ).toThrow('"body"');
  });

  it('throws for rich text in the aside', () => {
    expect(() =>
      formView(schema, {
        sections: [
          { fields: ['name', 'slug', 'seo'] },
          { placement: 'aside', fields: ['body'] },
        ],
      })
    ).toThrow('"body"');
  });
});
