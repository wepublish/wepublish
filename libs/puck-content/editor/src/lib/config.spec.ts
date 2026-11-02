import { config, getPuckConfig, puckConfigs } from './config';
import { ArticleRootConfig } from './root/article-root.config';
import { PageRootConfig } from './root/page-root.config';

describe('puckConfigs', () => {
  it('has a root per document kind', () => {
    expect(puckConfigs.page.root).toBe(PageRootConfig);
    expect(puckConfigs.article.root).toBe(ArticleRootConfig);
  });

  it('shares the components and categories between every document kind', () => {
    expect(puckConfigs.article.components).toBe(puckConfigs.page.components);
    expect(puckConfigs.article.categories).toBe(puckConfigs.page.categories);
  });

  it('looks the config of a document kind up', () => {
    expect(getPuckConfig('article')).toBe(puckConfigs.article);
    expect(getPuckConfig('page')).toBe(puckConfigs.page);
  });

  it('keeps the page config as the default config', () => {
    expect(config).toBe(puckConfigs.page);
  });
});

describe('categories', () => {
  const { components } = config;
  const categories: Partial<Record<string, { components?: string[] }>> =
    config.categories ?? {};

  it('groups forms and engagement components', () => {
    expect(categories).toHaveProperty('form');
    expect(categories.engagement?.components).toEqual(
      expect.arrayContaining([
        'Comment',
        'Event',
        'Crowdfunding',
        'Poll',
        'MailchimpForm',
      ])
    );
  });

  it('offers the form helpers in the form category', () => {
    expect(categories.form?.components).toEqual([
      'Form',
      'FormInput',
      'FormTextarea',
      'FormCheckbox',
      'FormSelect',
      'FormRadioGroup',
      'FormHidden',
      'FormSubmit',
    ]);
  });

  it('offers the Teaser first among the teaser blocks', () => {
    expect(categories.teaser?.components?.[0]).toBe('Teaser');
  });

  it('lists no component twice', () => {
    const listed = Object.values(categories).flatMap(
      category => category?.components ?? []
    );

    expect(new Set(listed).size).toBe(listed.length);
  });

  it('puts every component that is not hidden into a category', () => {
    const categorised = new Set(
      Object.entries(categories)
        .filter(([name]) => name !== 'other')
        .flatMap(([, category]) => category?.components ?? [])
    );

    expect(
      Object.entries(components)
        .filter(
          ([name, component]) => !component.hidden && !categorised.has(name)
        )
        .map(([name]) => name)
    ).toEqual([]);
  });

  it('keeps hidden components out of the categories', () => {
    const categorised = Object.values(categories).flatMap(
      category => category?.components ?? []
    );

    expect(categorised).not.toContain('LinkedTemplate');
  });

  it('only lists components that exist', () => {
    const listed = Object.values(categories).flatMap(
      category => category?.components ?? []
    );

    expect(listed.filter(name => !(name in components))).toEqual([]);
  });
});

describe('styling', () => {
  const unstyled = ['FormHidden'];

  it.each(
    Object.keys(config.components).filter(name => !unstyled.includes(name))
  )('%s has a styling tab', name => {
    expect(config.components[name]?.fields).toHaveProperty(
      'styling.type',
      'styling'
    );
  });

  it.each(['Title', 'RichText'])('%s has no text styling', name => {
    const field = config.components[name]?.fields?.styling as {
      groups?: string[];
    };

    expect(field.groups).toBeDefined();
    expect(field.groups).not.toContain('text');
  });
});
