import type { MockLink } from '@apollo/client/testing';
import {
  BannerActionRole,
  BannerDocument,
  type BannerQuery,
  CreateBannerDocument,
  type CreateBannerMutation,
  type CreateBannerMutationVariables,
  type FullBannerFragment,
  LoginStatus,
  UpdateBannerDocument,
  type UpdateBannerMutation,
  type UpdateBannerMutationVariables,
} from '@wepublish/editor/api';
import {
  imageFixture,
  imageListMock,
  imageMock,
  pageFixture,
  pageListMock,
  updateImageMock,
} from '@wepublish/form/editor/testing';
import {
  CanCreateImage,
  CanDeleteImage,
  CanGetImage,
  CanGetImages,
} from '@wepublish/permissions';
import type { AuthContextState } from '@wepublish/ui/editor';

type Mock = MockLink.MockedResponse;

export const portrait = imageFixture('image-portrait', 'Portrait');
export const landscape = imageFixture('image-landscape', 'Landschaft');
export const retitledPortrait = { ...portrait, title: 'Portrait im Park' };

export const homePage = pageFixture('page-home', 'Startseite');
export const aboutPage = pageFixture('page-about', 'Über uns');

export const storedAction: NonNullable<FullBannerFragment['actions']>[number] =
  {
    __typename: 'BannerAction',
    id: 'action-1',
    label: 'Abo lösen',
    url: 'https://example.com/abo',
    style: 'outline',
    role: BannerActionRole.Primary,
  };

export const storedBanner: FullBannerFragment = {
  __typename: 'Banner',
  id: 'banner-1',
  title: 'Jetzt abonnieren',
  text: 'Unterstütze unabhängigen Journalismus.',
  cta: 'Mach mit',
  active: true,
  collapsible: false,
  delay: 5,
  hideForMinutes: 60,
  html: null,
  embedUrl: null,
  showOnArticles: true,
  showForLoginStatus: LoginStatus.Unsubscribed,
  showOnPages: [{ __typename: 'PageModel', id: homePage.id }],
  image: portrait,
  actions: [storedAction],
};

export const imageEditor: AuthContextState = {
  session: {
    email: 'editor@example.com',
    sessionToken: 'session-token',
    sessionRoles: [
      {
        __typename: 'UserRole',
        id: 'image-editor',
        name: 'image-editor',
        description: null,
        systemRole: false,
        permissions: [
          CanCreateImage,
          CanGetImage,
          CanGetImages,
          CanDeleteImage,
        ].map(permission => ({
          __typename: 'Permission' as const,
          ...permission,
        })),
      },
    ],
  },
};

export const wireFormat = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export function bannerMock(banner: FullBannerFragment | null): Mock {
  const data = { __typename: 'Query', banner } as BannerQuery;

  return {
    request: {
      query: BannerDocument,
      variables: { id: banner?.id ?? storedBanner.id },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: { data },
  };
}

export function bannerErrorMock(id: string, message: string): Mock {
  return {
    request: { query: BannerDocument, variables: { id } },
    error: new Error(message),
  };
}

export function createBannerMock(
  onRequest: (variables: CreateBannerMutationVariables) => void,
  id = 'banner-new'
): Mock {
  return {
    request: { query: CreateBannerDocument, variables: () => true },
    result: (variables: CreateBannerMutationVariables) => {
      onRequest(variables);

      const { imageId, showOnPages, actions, ...input } = variables.input;
      const data: CreateBannerMutation = {
        __typename: 'Mutation',
        createBanner: {
          ...storedBanner,
          ...input,
          id,
          cta: input.cta ?? null,
          html: input.html ?? null,
          embedUrl: input.embedUrl ?? null,
          image: imageId ? portrait : null,
          showOnPages: (showOnPages ?? []).map(page => ({
            __typename: 'PageModel',
            id: page.id,
          })),
          actions: (actions ?? []).map((action, index) => ({
            __typename: 'BannerAction',
            id: `action-new-${index}`,
            ...action,
          })),
        },
      };

      return { data };
    },
  };
}

export function updateBannerMock(
  onRequest: (variables: UpdateBannerMutationVariables) => void
): Mock {
  return {
    request: { query: UpdateBannerDocument, variables: () => true },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: (variables: UpdateBannerMutationVariables) => {
      onRequest(variables);

      const data: UpdateBannerMutation = {
        __typename: 'Mutation',
        updateBanner: storedBanner,
      };

      return { data };
    },
  };
}

export function failingMutationMock(
  document: typeof CreateBannerDocument | typeof UpdateBannerDocument,
  message: string
): Mock {
  return {
    request: { query: document, variables: () => true },
    error: new Error(message),
  };
}

export const pickerMocks = (
  onImageUpdate: (variables: unknown) => void = () => undefined
): Mock[] => [
  pageListMock([homePage, aboutPage]),
  imageListMock([portrait, landscape]),
  imageMock(portrait),
  updateImageMock(retitledPortrait, onImageUpdate),
];
