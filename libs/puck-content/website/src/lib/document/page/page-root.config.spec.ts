import { TagType } from '@wepublish/editor/api';
import { pageRootSchema, rootFieldAi } from '@wepublish/puck-content/editor';

import { pageRootFieldTabs } from '../../field-tabs/field-tabs';
import { PageRoot } from './page-root.component';
import { PageRootConfig } from './page-root.config';

const layoutOf = (config: typeof PageRootConfig) =>
  (
    config.renderFields?.({ fields: {} } as never) as {
      props: { layout: unknown };
    }
  ).props.layout;

describe('PageRootConfig', () => {
  it('names the document in the sidebar heading and breadcrumbs', () => {
    expect(PageRootConfig.label).toBe('Page');
  });

  it('edits the metadata of a page', () => {
    expect(Object.keys(PageRootConfig.fields ?? {})).toEqual([
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
    ]);
  });

  it('selects page tags', () => {
    expect(PageRootConfig.fields?.tags).toMatchObject({
      type: 'tagSelect',
      tagType: TagType.Page,
      ai: rootFieldAi(pageRootSchema, 'tags'),
    });
  });

  it('describes every field to the AI with the page wording', () => {
    expect(PageRootConfig.fields?.title?.ai).toEqual(
      rootFieldAi(pageRootSchema, 'title')
    );
    expect(PageRootConfig.fields?.showFooter?.ai).toEqual(
      rootFieldAi(pageRootSchema, 'showFooter')
    );
  });

  it('shows navigation and footer by default', () => {
    expect(PageRootConfig.defaultProps).toEqual({
      showFooter: true,
      showNavigation: true,
    });
  });

  it('renders the page with its fields in the page tabs', () => {
    expect(PageRootConfig.render).toBe(PageRoot);
    expect(layoutOf(PageRootConfig)).toBe(pageRootFieldTabs);
  });
});
