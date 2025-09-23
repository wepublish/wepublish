import {
  ArticleInput,
  ArticleList,
  ArticleListQuery,
  ArticleListQueryVariables,
  BlockInput,
  CreateArticle,
  CreateArticleMutation,
  CreateArticleMutationVariables,
  DeleteArticle,
  DeleteArticleMutation,
  DeleteArticleMutationVariables,
  PublishArticle,
  PublishArticleMutation,
  PublishArticleMutationVariables,
  UpdateArticle,
  UpdateArticleMutation,
  UpdateArticleMutationVariables,
} from '../../api/private';
import { Article, ArticleQuery, ArticleQueryVariables } from '../../api/public';
import { privateClient, publicClient } from '../api/clients';
import { Author } from './author';
import { Tag } from './tags';
import { Image } from './image';
import { slugify } from './utils';

type EnsureArticleProps = {
  id?: string;
  title: string;
  lead: string;
  slug: string;
  createdAt: Date;
  modifiedAt: Date;
  blocks: BlockInput[];
  authors: Author[];
  tags: Tag[];
  featuredImage?: Image;
};

export async function ensureArticle(props: EnsureArticleProps) {
  const {
    id,
    tags,
    featuredImage,
    authors,
    slug,
    blocks,
    createdAt,
    modifiedAt,
    lead,
    title,
  } = props;

  console.debug('  article create', slug);
  logArticleBlocks(blocks);

  const input: ArticleInput = {
    lead,
    title,
    authorIDs: authors.map(a => a.id),
    breaking: false,
    hideAuthor: false,
    properties: [],
    shared: false,
    disableComments: true,
    socialMediaAuthorIDs: [],
    tags: tags.map(t => t.id),
    blocks,
    slug,
    imageID: featuredImage ? featuredImage.id : undefined,
  };

  const article =
    id ? await updateArticle({ id, input }) : await createArticle({ input });
  return await publishArticle(article.id, createdAt, modifiedAt);
}

function logArticleBlocks(blocks: BlockInput[]) {
  blocks
    .map(block => {
      if (block.richText) {
        return { richtext: { ...block.richText, richText: '<content>' } };
      } else {
        return block;
      }
    })
    .map(b => JSON.stringify(b))
    .forEach(b => console.debug(`    ${b}`));
}

// API

export async function createArticle(variables: CreateArticleMutationVariables) {
  return (
    await privateClient.request<
      CreateArticleMutation,
      CreateArticleMutationVariables
    >(CreateArticle, variables)
  ).createArticle!;
}

export async function updateArticle(variables: UpdateArticleMutationVariables) {
  return (
    await privateClient.request<
      UpdateArticleMutation,
      UpdateArticleMutationVariables
    >(UpdateArticle, variables)
  ).updateArticle!;
}

export async function deleteArticle(id: string) {
  return (
    await privateClient.request<
      DeleteArticleMutation,
      DeleteArticleMutationVariables
    >(DeleteArticle, {
      id,
    })
  ).deleteArticle;
}

export async function publishArticle(
  id: string,
  publishDate: Date,
  lastModifiedDate: Date
) {
  return (
    await privateClient.request<
      PublishArticleMutation,
      PublishArticleMutationVariables
    >(PublishArticle, {
      id,
      publishAt: publishDate.toISOString(),
      publishedAt: publishDate.toISOString(),
      updatedAt: lastModifiedDate.toISOString(),
    })
  ).publishArticle!.published!;
}

export async function getArticleBySlug(slug: string) {
  return (
    await publicClient.request<ArticleQuery, ArticleQueryVariables>(Article, {
      slug: slugify(slug),
    })
  ).article;
}

export async function getArticleIdByTitle(title: string) {
  return (
    await privateClient.request<ArticleListQuery, ArticleListQueryVariables>(
      ArticleList,
      {
        filter: title,
      }
    )
  ).articles?.nodes[0]?.id;
}
