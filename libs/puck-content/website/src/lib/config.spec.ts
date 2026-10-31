import { config, getPuckConfig, puckConfigs } from './config';
import { ArticleRootConfig } from './document/article/article-root.config';
import { PageRootConfig } from './document/page/page-root.config';

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

  it('groups forms and data driven components', () => {
    expect(categories).toHaveProperty('form');
    expect(categories.data?.components).toEqual(
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

  it('puts every component into a category', () => {
    const categorised = new Set(
      Object.entries(categories)
        .filter(([name]) => name !== 'other')
        .flatMap(([, category]) => category?.components ?? [])
    );

    expect(
      Object.keys(components).filter(name => !categorised.has(name))
    ).toEqual([]);
  });

  it('only lists components that exist', () => {
    const listed = Object.values(categories).flatMap(
      category => category?.components ?? []
    );

    expect(listed.filter(name => !(name in components))).toEqual([]);
  });
});
