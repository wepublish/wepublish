import { FullArticleFragment, FullPageFragment } from '@wepublish/editor/api';
import {
  ArticleRootProps,
  PageRootProps,
  PuckDocumentStatus,
  PuckPublishDialogConfig,
} from '@wepublish/puck-content/editor';
import { PuckDocumentKind } from '@wepublish/puck-content/website';
import { TFunction } from 'i18next';

type PublishedRevision = { publishedAt: string | null };

export type PuckDocumentRevisions = {
  draft: { id: string } | null;
  pending: PublishedRevision | null;
  published: PublishedRevision | null;
};

type Names = ReadonlyMap<string, string>;

type NamedImage = { id: string; filename: string | null } | null | undefined;

const editorKeys: Record<PuckDocumentKind, string> = {
  article: 'articleEditor',
  page: 'pageEditor',
};

export const puckDocumentStatus = (
  document?: PuckDocumentRevisions
): PuckDocumentStatus =>
  document?.pending ? 'pending'
  : document?.published && !document.draft ? 'published'
  : 'draft';

export const hasUnpublishedChanges = (document?: PuckDocumentRevisions) =>
  !!document?.draft;

export const puckDocumentStatusLabel = (
  t: TFunction,
  kind: PuckDocumentKind,
  document?: PuckDocumentRevisions
): string => {
  const editor = editorKeys[kind];

  if (document?.pending) {
    return t(`${editor}.overview.pending`, {
      date: new Date(document.pending.publishedAt ?? ''),
    });
  }

  if (document?.published && !document.draft) {
    return t(`${editor}.overview.published`, {
      date: new Date(document.published.publishedAt ?? ''),
    });
  }

  if (document?.published) {
    return t('versionHistory.state.draft');
  }

  return t(`${editor}.overview.unpublished`);
};

const namesOf = (ids: string[] | undefined, names: Names) =>
  ids?.length ? ids.map(id => names.get(id) ?? id).join(', ') : undefined;

const nameOf = (id: string | undefined, names: Names) =>
  id ? (names.get(id) ?? id) : undefined;

const imageNames = (...images: NamedImage[]) =>
  images.flatMap(image =>
    image ? [[image.id, image.filename ?? image.id] as const] : []
  );

const articleNames = (article?: FullArticleFragment): Names =>
  new Map([
    ...(article?.latest.authors ?? []).map(
      ({ author }) => [author.id, author.name] as const
    ),
    ...(article?.latest.socialMediaAuthors ?? []).flatMap(author =>
      author ? [[author.id, author.name] as const] : []
    ),
    ...(article?.tags ?? []).map(({ id, tag }) => [id, tag ?? id] as const),
    ...imageNames(article?.latest.image, article?.latest.socialMediaImage),
  ]);

const pageNames = (page?: FullPageFragment): Names =>
  new Map([
    ...(page?.tags ?? []).map(({ id, tag }) => [id, tag ?? id] as const),
    ...imageNames(page?.latest.image, page?.latest.socialMediaImage),
  ]);

const dateOf = (value: string | null | undefined) =>
  value ? new Date(value) : undefined;

export const articlePublishDialog = (
  t: TFunction,
  article: FullArticleFragment | undefined,
  props: ArticleRootProps
): PuckPublishDialogConfig => {
  const names = articleNames(article);
  const firstPublishedAt = dateOf(article?.publishedAt);

  return {
    title: t('articleEditor.panels.publishArticle'),
    url: article?.url,
    publishedAt: dateOf(article?.latest.publishedAt),
    dateLabel: t('articleEditor.panels.publishDate'),
    dateHelperText:
      firstPublishedAt ?
        t('articleEditor.panels.firstPublishedAtDate', {
          firstPublishedAtDate: firstPublishedAt,
        })
      : t('articleEditor.panels.notPublishedYet'),
    pendingMessage: pendingPublishDate =>
      t('articleEditor.panels.articlePending', { pendingPublishDate }),
    options: [
      props.breaking && t('articleEditor.panels.breakingNews'),
      props.shared && t('articleEditor.panels.sharedWithPeers'),
      props.hideAuthor && t('articleEditor.panels.hideAuthors'),
    ].filter((option): option is string => !!option),
    checks: [
      {
        label: t('articleEditor.panels.slug'),
        value: props.slug,
        missing: t('articleEditor.panels.addSlug'),
        required: true,
      },
      {
        label: t('articleEditor.panels.preTitle'),
        value: props.preTitle,
      },
      {
        label: t('articleEditor.panels.title'),
        value: props.title,
        missing: t('articleEditor.panels.enterTitle'),
      },
      {
        label: t('articleEditor.panels.lead'),
        value: props.lead,
      },
      {
        label: t('articleEditor.panels.authors'),
        value: namesOf(props.authorIds, names),
        missing: t('articleEditor.panels.enterAuthors'),
      },
      {
        label: t('articleEditor.panels.tags'),
        value: namesOf(props.tags, names),
        missing: t('articleEditor.panels.enterTag'),
      },
      {
        label: t('articleEditor.panels.image'),
        value: nameOf(props.imageId, names),
        missing: t('articleEditor.panels.enterImage'),
      },
      {
        label: t('articleEditor.panels.seoTitle'),
        value: props.seoTitle,
        missing: t('articleEditor.panels.enterSeoTitle'),
      },
      {
        label: t('articleEditor.panels.seoDescription'),
        value: props.seoDescription,
      },
      {
        label: t('articleEditor.panels.socialMediaTitle'),
        value: props.socialMediaTitle,
        missing: t('articleEditor.panels.enterSocialMediaTitle'),
      },
      {
        label: t('articleEditor.panels.socialMediaDescription'),
        value: props.socialMediaDescription,
        missing: t('articleEditor.panels.enterSocialMediaDescription'),
      },
      {
        label: t('articleEditor.panels.socialMediaAuthors'),
        value: namesOf(props.socialMediaAuthorIds, names),
        missing: t('articleEditor.panels.enterSocialMediaAuthors'),
      },
      {
        label: t('articleEditor.panels.socialMediaImage'),
        value: nameOf(props.socialMediaImageId, names),
        missing: t('articleEditor.panels.enterSocialMediaImage'),
      },
    ],
  };
};

export const pagePublishDialog = (
  t: TFunction,
  page: FullPageFragment | undefined,
  props: PageRootProps
): PuckPublishDialogConfig => {
  const names = pageNames(page);

  return {
    title: t('pageEditor.panels.publishPage'),
    url: page?.url,
    publishedAt: dateOf(page?.latest.publishedAt),
    dateLabel: t('pageEditor.panels.publishDate'),
    pendingMessage: pendingPublishDate =>
      t('pageEditor.panels.pagePending', { pendingPublishDate }),
    checks: [
      {
        label: t('pageEditor.panels.title'),
        value: props.title,
        missing: t('pageEditor.panels.enterTitle'),
      },
      {
        label: t('pageEditor.panels.description'),
        value: props.lead,
        missing: t('pageEditor.panels.enterDescription'),
      },
      {
        label: t('pageEditor.panels.seoTitle'),
        value: props.seoTitle,
      },
      {
        label: t('pageEditor.panels.seoDescription'),
        value: props.seoDescription,
      },
      {
        label: t('pageEditor.panels.slug'),
        value: props.slug,
      },
      {
        label: t('pageEditor.panels.tags'),
        value: namesOf(props.tags, names),
      },
      {
        label: t('pageEditor.panels.image'),
        value: nameOf(props.imageId, names),
        missing: t('pageEditor.panels.enterImage'),
      },
      {
        label: t('pageEditor.panels.socialMediaTitle'),
        value: props.socialMediaTitle,
        missing: t('pageEditor.panels.enterSocialMediaTitle'),
      },
      {
        label: t('pageEditor.panels.socialMediaDescription'),
        value: props.socialMediaDescription,
        missing: t('pageEditor.panels.enterSocialMediaDescription'),
      },
      {
        label: t('pageEditor.panels.socialMediaImage'),
        value: nameOf(props.socialMediaImageId, names),
        missing: t('pageEditor.panels.enterSocialMediaImage'),
      },
    ],
  };
};
