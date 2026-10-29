import { groupFieldTabs, rootFieldTabs } from './field-tabs';

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
