import { TagType } from '@wepublish/editor/api';
import { articleRootSchema, rootFieldAi } from '@wepublish/puck-content/editor';

import { articleRootFieldTabs } from '../../field-tabs/field-tabs';
import { ArticleRoot } from './article-root.component';
import { ArticleRootConfig } from './article-root.config';

const layoutOf = (config: typeof ArticleRootConfig) =>
  (
    config.renderFields?.({ fields: {} } as never) as {
      props: { layout: unknown };
    }
  ).props.layout;

describe('ArticleRootConfig', () => {
  it('names the document in the sidebar heading and breadcrumbs', () => {
    expect(ArticleRootConfig.label).toBe('Article');
  });

  it('edits the metadata of an article', () => {
    expect(Object.keys(ArticleRootConfig.fields ?? {})).toEqual([
      'preTitle',
      'title',
      'lead',
      'imageId',
      'slug',
      'canonicalUrl',
      'authorIds',
      'hideAuthor',
      'tags',
      'paywallId',
      'breaking',
      'hidden',
      'disableComments',
      'shared',
      'seoTitle',
      'seoDescription',
      'socialMediaTitle',
      'socialMediaDescription',
      'socialMediaImageId',
      'socialMediaAuthorIds',
      'properties',
    ]);
  });

  it('picks authors and the paywall from existing records', () => {
    expect(ArticleRootConfig.fields?.authorIds).toMatchObject({
      type: 'record',
      model: 'author',
      multiple: true,
      ai: rootFieldAi(articleRootSchema, 'authorIds'),
    });
    expect(ArticleRootConfig.fields?.socialMediaAuthorIds).toMatchObject({
      type: 'record',
      model: 'author',
      multiple: true,
    });
    expect(ArticleRootConfig.fields?.paywallId).toMatchObject({
      type: 'record',
      model: 'paywall',
    });
    expect(ArticleRootConfig.fields?.paywallId).not.toHaveProperty('multiple');
  });

  it('selects article tags', () => {
    expect(ArticleRootConfig.fields?.tags).toMatchObject({
      type: 'tagSelect',
      tagType: TagType.Article,
      ai: rootFieldAi(articleRootSchema, 'tags'),
    });
  });

  it('describes every field to the AI with the article wording', () => {
    expect(ArticleRootConfig.fields?.title?.ai).toEqual(
      rootFieldAi(articleRootSchema, 'title')
    );
  });

  it('renders the article with its fields in the article tabs', () => {
    expect(ArticleRootConfig.render).toBe(ArticleRoot);
    expect(layoutOf(ArticleRootConfig)).toBe(articleRootFieldTabs);
  });
});
