import {
  componentFieldTabs,
  contentDatasourceFieldTabs,
  groupFieldTabs,
  rootFieldTabs,
  withFieldTabsAll,
} from './field-tabs';

describe('groupFieldTabs', () => {
  it('puts styling, visibility and datasources into their own tabs', () => {
    expect(
      groupFieldTabs(['title', 'css', 'layout', 'visibility', 'datasources'])
    ).toEqual([
      { value: 'layout', fields: ['layout'] },
      { value: 'content', fields: ['title'] },
      { value: 'style', fields: ['css'] },
      { value: 'data', fields: ['datasources'] },
      { value: 'visibility', fields: ['visibility'] },
    ]);
  });

  it('leaves out tabs without fields', () => {
    expect(groupFieldTabs(['title', 'visibility'])).toEqual([
      { value: 'content', fields: ['title'] },
      { value: 'visibility', fields: ['visibility'] },
    ]);
  });

  it('needs no tabs when a component only has content fields', () => {
    expect(groupFieldTabs(['title', 'text'])).toEqual([
      { value: 'content', fields: ['title', 'text'] },
    ]);
  });
});

describe('rootFieldTabs', () => {
  it('splits the page metadata like the page metadata panel', () => {
    expect(
      groupFieldTabs(
        [
          'title',
          'lead',
          'imageId',
          'slug',
          'tags',
          'hidden',
          'showNavigation',
          'showFooter',
          'seoTitle',
          'seoDescription',
          'socialMediaTitle',
          'socialMediaDescription',
          'socialMediaImageId',
          'properties',
        ],
        rootFieldTabs
      )
    ).toEqual([
      {
        value: 'general',
        fields: [
          'title',
          'lead',
          'imageId',
          'slug',
          'tags',
          'hidden',
          'showNavigation',
          'showFooter',
        ],
      },
      { value: 'seo', fields: ['seoTitle', 'seoDescription'] },
      {
        value: 'socialMedia',
        fields: [
          'socialMediaTitle',
          'socialMediaDescription',
          'socialMediaImageId',
        ],
      },
      { value: 'properties', fields: ['properties'] },
    ]);
  });
});

describe('contentDatasourceFieldTabs', () => {
  it('keeps the datasource next to the content', () => {
    expect(
      groupFieldTabs(
        ['caption', 'datasources', 'css'],
        contentDatasourceFieldTabs
      )
    ).toEqual([
      { value: 'content', fields: ['caption', 'datasources'] },
      { value: 'style', fields: ['css'] },
    ]);
  });
});

describe('withFieldTabsAll', () => {
  it('uses the layout given for a component', () => {
    const render = () => null;
    const { Image, Title } = withFieldTabsAll(
      { Image: { render }, Title: { render } },
      { Image: contentDatasourceFieldTabs }
    );

    const layoutOf = (config: typeof Image) =>
      (
        config.renderFields?.({ fields: {} } as never) as {
          props: { layout: unknown };
        }
      ).props.layout;

    expect(layoutOf(Image)).toBe(contentDatasourceFieldTabs);
    expect(layoutOf(Title)).toBe(componentFieldTabs);
  });
});
