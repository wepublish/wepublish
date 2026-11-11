import type { MockLink } from '@apollo/client/testing';
import {
  ArticleListDocument,
  type ArticleListQuery,
  type ArticleListQueryVariables,
  Currency,
  type FullImageFragment,
  type FullMemberPlanFragment,
  type FullPaywallFragment,
  type FullTagFragment,
  type FullUserFragment,
  ImageDocument,
  type ImageListQuery,
  type ImageListQueryVariables,
  ImageListDocument,
  type ImageQuery,
  MemberPlanListDocument,
  type MemberPlanListQuery,
  type MemberPlanListQueryVariables,
  PageListDocument,
  type PageListQuery,
  type PageListQueryVariables,
  type PageWithoutBlocksFragment,
  PaywallListDocument,
  type PaywallListQuery,
  ProductType,
  TagDocument,
  TagListDocument,
  type TagListQuery,
  type TagListQueryVariables,
  type TagQuery,
  TagType,
  UpdateImageDocument,
  type UpdateImageMutation,
  type UpdateImageMutationVariables,
  UserListDocument,
  type UserListQuery,
  type UserListQueryVariables,
} from '@wepublish/editor/api';

type Mock = MockLink.MockedResponse;

const timestamp = '2026-01-01T00:00:00.000Z';

const anyVariables = () => true;

const pageInfo = (hasNextPage: boolean) => ({
  __typename: 'PageInfo' as const,
  startCursor: null,
  endCursor: null,
  hasNextPage,
  hasPreviousPage: false,
});

const matches = (
  text: string | null | undefined,
  search: string | null | undefined
) => !search || (text ?? '').toLowerCase().includes(search.toLowerCase());

function pageOf<T>(
  items: T[],
  skip: number | null | undefined,
  take: number | null | undefined
) {
  const start = skip ?? 0;
  const end = take === null || take === undefined ? items.length : start + take;

  return { nodes: items.slice(start, end), hasNextPage: end < items.length };
}

export function imageFixture(id: string, title: string): FullImageFragment {
  const url = `https://media.example.com/${id}.jpg`;

  return {
    __typename: 'Image',
    id,
    createdAt: timestamp,
    modifiedAt: timestamp,
    title,
    filename: id,
    extension: '.jpg',
    width: 800,
    height: 600,
    fileSize: 1024,
    description: null,
    tags: [],
    source: null,
    link: null,
    license: null,
    focalPointX: 0.5,
    focalPointY: 0.5,
    url,
    largeURL: url,
    mediumURL: url,
    thumbURL: url,
    squareURL: url,
    previewURL: url,
    column1URL: url,
    column6URL: url,
  };
}

export function imageListMock(images: FullImageFragment[]): Mock {
  return {
    request: { query: ImageListDocument, variables: anyVariables },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: (variables: ImageListQueryVariables) => {
      const found = images.filter(image =>
        matches(image.title, variables.filter)
      );
      const { nodes, hasNextPage } = pageOf(found, 0, variables.take);
      const data: ImageListQuery = {
        __typename: 'Query',
        images: {
          __typename: 'PaginatedImages',
          nodes,
          pageInfo: pageInfo(hasNextPage),
          totalCount: found.length,
        },
      };

      return { data };
    },
  };
}

export function imageMock(image: FullImageFragment): Mock {
  const data: ImageQuery = { __typename: 'Query', image };

  return {
    request: { query: ImageDocument, variables: { id: image.id } },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: { data },
  };
}

export function updateImageMock(
  image: FullImageFragment,
  onRequest: (variables: UpdateImageMutationVariables) => void = () => undefined
): Mock {
  return {
    request: { query: UpdateImageDocument, variables: anyVariables },
    result: (variables: UpdateImageMutationVariables) => {
      onRequest(variables);

      const data: UpdateImageMutation = {
        __typename: 'Mutation',
        updateImage: image,
      };

      return { data };
    },
  };
}

export function tagFixture(
  id: string,
  tag: string,
  type = TagType.Event
): FullTagFragment {
  return {
    __typename: 'Tag',
    id,
    tag,
    description: null,
    type,
    main: false,
    url: `https://example.com/tag/${id}`,
    color: null,
  };
}

export function tagListMock(
  tags: FullTagFragment[],
  onRequest: (variables: TagListQueryVariables) => void = () => undefined
): Mock {
  return {
    request: { query: TagListDocument, variables: anyVariables },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: (variables: TagListQueryVariables) => {
      onRequest(variables);

      const found = tags.filter(
        tag =>
          (!variables.filter?.type || tag.type === variables.filter.type) &&
          matches(tag.tag, variables.filter?.tag)
      );
      const { nodes, hasNextPage } = pageOf(
        found,
        variables.skip,
        variables.take
      );
      const data: TagListQuery = {
        __typename: 'Query',
        tags: {
          __typename: 'PaginatedTags',
          nodes,
          pageInfo: pageInfo(hasNextPage),
          totalCount: found.length,
        },
      };

      return { data };
    },
  };
}

export function tagMock(tag: FullTagFragment): Mock {
  const data: TagQuery = { __typename: 'Query', tag };

  return {
    request: { query: TagDocument, variables: { id: tag.id } },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: { data },
  };
}

export function pageFixture(
  id: string,
  title: string
): PageWithoutBlocksFragment {
  return {
    __typename: 'Page',
    id,
    publishedAt: timestamp,
    createdAt: timestamp,
    modifiedAt: timestamp,
    slug: id,
    url: `https://example.com/${id}`,
    previewUrl: `https://example.com/preview/${id}`,
    hidden: false,
    hideHeader: false,
    hideFooter: false,
    tags: [],
    latest: {
      __typename: 'PageRevision',
      id: `${id}-revision`,
      createdAt: timestamp,
      publishedAt: timestamp,
      archivedAt: null,
      title,
      description: null,
      seoTitle: null,
      seoDescription: null,
      socialMediaTitle: null,
      socialMediaDescription: null,
      image: null,
      socialMediaImage: null,
      properties: [],
    },
    draft: null,
    pending: null,
    published: {
      __typename: 'PageRevision',
      id: `${id}-revision`,
      publishedAt: timestamp,
    },
  };
}

export function pageListMock(
  pages: PageWithoutBlocksFragment[],
  onRequest: (variables: PageListQueryVariables) => void = () => undefined
): Mock {
  return {
    request: { query: PageListDocument, variables: anyVariables },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: (variables: PageListQueryVariables) => {
      onRequest(variables);

      const found = pages.filter(page =>
        matches(page.latest.title, variables.filter?.title)
      );
      const { nodes, hasNextPage } = pageOf(
        found,
        variables.skip,
        variables.take
      );
      const data: PageListQuery = {
        __typename: 'Query',
        pages: {
          __typename: 'PaginatedPages',
          nodes,
          pageInfo: pageInfo(hasNextPage),
          totalCount: found.length,
        },
      };

      return { data };
    },
  };
}

export type ArticleListNode = ArticleListQuery['articles']['nodes'][number];

export function articleFixture(
  id: string,
  title: string | null
): ArticleListNode {
  const url = `https://example.com/a/${id}`;

  return {
    __typename: 'Article',
    id,
    publishedAt: timestamp,
    createdAt: timestamp,
    modifiedAt: timestamp,
    shared: false,
    hidden: false,
    disableComments: false,
    slug: id,
    likes: 0,
    url,
    previewUrl: `${url}/preview`,
    paywallId: null,
    latest: {
      __typename: 'ArticleRevision',
      id: `${id}-revision`,
      createdAt: timestamp,
      publishedAt: timestamp,
      archivedAt: null,
      preTitle: null,
      title,
      lead: null,
      seoTitle: null,
      seoDescription: null,
      canonicalUrl: null,
      hideAuthor: false,
      breaking: false,
      socialMediaTitle: null,
      socialMediaDescription: null,
      authors: [],
      socialMediaAuthors: [],
      image: null,
      socialMediaImage: null,
      properties: [],
    },
    draft: null,
    pending: null,
    published: {
      __typename: 'ArticleRevision',
      id: `${id}-revision`,
      publishedAt: timestamp,
    },
    tags: [],
    peer: null,
    trackingPixels: [],
  };
}

export function articleListMock(
  articles: ArticleListNode[],
  onRequest: (variables: ArticleListQueryVariables) => void = () => undefined
): Mock {
  return {
    request: { query: ArticleListDocument, variables: anyVariables },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: (variables: ArticleListQueryVariables) => {
      onRequest(variables);

      const ids = variables.filter?.ids;
      const found = articles.filter(
        article =>
          (!ids || ids.includes(article.id)) &&
          matches(article.latest.title, variables.filter?.title)
      );
      const { nodes, hasNextPage } = pageOf(
        found,
        variables.skip,
        variables.take
      );
      const data: ArticleListQuery = {
        __typename: 'Query',
        articles: {
          __typename: 'PaginatedArticles',
          nodes,
          pageInfo: pageInfo(hasNextPage),
          totalCount: found.length,
        },
      };

      return { data };
    },
  };
}

export function paywallFixture(id: string, name: string): FullPaywallFragment {
  return {
    __typename: 'Paywall',
    id,
    createdAt: timestamp,
    modifiedAt: timestamp,
    name,
    description: null,
    circumventDescription: null,
    upgradeDescription: null,
    upgradeCircumventDescription: null,
    active: true,
    anyMemberPlan: true,
    alternativeSubscribeUrl: null,
    fadeout: false,
    hideContentAfter: 0,
    memberPlans: [],
    bypasses: [],
  };
}

export function paywallListMock(paywalls: FullPaywallFragment[]): Mock {
  const data: PaywallListQuery = { __typename: 'Query', paywalls };

  return {
    request: { query: PaywallListDocument, variables: anyVariables },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: { data },
  };
}

export function memberPlanFixture(
  id: string,
  name: string
): FullMemberPlanFragment {
  return {
    __typename: 'MemberPlan',
    id,
    createdAt: timestamp,
    modifiedAt: timestamp,
    name,
    description: null,
    shortDescription: null,
    slug: id,
    active: true,
    productType: ProductType.Subscription,
    tags: [],
    externalReward: null,
    currency: Currency.Chf,
    extendable: true,
    maxCount: null,
    migrateToTargetPaymentMethodID: null,
    defaultPaymentPeriodicity: null,
    successPageId: null,
    failPageId: null,
    confirmationPageId: null,
    periodicityPricing: [],
    image: null,
    availablePaymentMethods: [],
  };
}

export function memberPlanListMock(
  memberPlans: FullMemberPlanFragment[],
  onRequest: (variables: MemberPlanListQueryVariables) => void = () => undefined
): Mock {
  return {
    request: { query: MemberPlanListDocument, variables: anyVariables },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: (variables: MemberPlanListQueryVariables) => {
      onRequest(variables);

      const found = memberPlans.filter(plan =>
        matches(plan.name, variables.filter?.name)
      );
      const { nodes, hasNextPage } = pageOf(
        found,
        variables.skip,
        variables.take
      );
      const data: MemberPlanListQuery = {
        __typename: 'Query',
        memberPlans: {
          __typename: 'PaginatedMemberPlans',
          nodes,
          pageInfo: pageInfo(hasNextPage),
          totalCount: found.length,
        },
      };

      return { data };
    },
  };
}

export function userFixture(
  id: string,
  firstName: string,
  name: string,
  email = `${id}@example.com`
): FullUserFragment {
  return {
    __typename: 'SensitiveDataUser',
    id,
    createdAt: timestamp,
    modifiedAt: timestamp,
    name,
    firstName,
    flair: null,
    birthday: null,
    active: true,
    lastLogin: null,
    email,
    emailVerifiedAt: null,
    emailQuality: null,
    note: null,
    totpEnabled: false,
    totpExempt: false,
    address: null,
    image: null,
    properties: [],
    roles: [],
  };
}

export function userListMock(
  users: FullUserFragment[],
  onRequest: (variables: UserListQueryVariables) => void = () => undefined
): Mock {
  return {
    request: { query: UserListDocument, variables: anyVariables },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: (variables: UserListQueryVariables) => {
      onRequest(variables);

      const found = users.filter(user =>
        matches(
          `${user.firstName ?? ''} ${user.name} ${user.email}`,
          variables.filter?.text
        )
      );
      const { nodes, hasNextPage } = pageOf(
        found,
        variables.skip,
        variables.take
      );
      const data: UserListQuery = {
        __typename: 'Query',
        users: {
          __typename: 'PaginatedSensitiveDataUsers',
          nodes,
          pageInfo: pageInfo(hasNextPage),
          totalCount: found.length,
        },
      };

      return { data };
    },
  };
}
