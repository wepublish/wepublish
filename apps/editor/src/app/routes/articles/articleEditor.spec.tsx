import { act, render } from '@testing-library/react';
import { useState } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { ArticleEditor } from './articleEditor';

const updateArticleCalls = vi.hoisted(() => [] as (() => void)[]);

function useFakeMutation(resolveLater = false) {
  const [loading, setLoading] = useState(false);

  const mutate = () => {
    setLoading(true);

    return new Promise(resolve => {
      const finish = () => {
        setLoading(false);
        resolve({ data: { updateArticle: { id: 'article-1' } } });
      };

      if (resolveLater) {
        updateArticleCalls.push(finish);
      } else {
        finish();
      }
    });
  };

  return [mutate, { loading }] as const;
}

const article = {
  id: 'article-1',
  slug: 'slug',
  url: 'https://example.com/a/slug',
  previewUrl: 'https://example.com/a/slug?preview',
  shared: false,
  hidden: false,
  disableComments: false,
  likes: 0,
  paywallId: null,
  trackingPixels: [],
  tags: [],
  draft: { id: 'rev-1' },
  published: null,
  pending: null,
  peer: null,
  latest: {
    id: 'rev-1',
    createdAt: '2026-09-30T10:00:00.000Z',
    publishedAt: null,
    preTitle: '',
    title: 'Title',
    lead: '',
    seoTitle: '',
    seoDescription: '',
    breaking: false,
    authors: [],
    image: null,
    blocks: [],
    properties: [],
    hideAuthor: false,
    canonicalUrl: '',
    socialMediaTitle: '',
    socialMediaDescription: '',
    socialMediaAuthors: [],
    socialMediaImage: null,
  },
};

const articleQueryResult = {
  data: { article },
  loading: false,
  refetch: vi.fn(),
};

const revisionListQueryResult = {
  data: undefined,
  loading: false,
  refetch: vi.fn(),
  fetchMore: vi.fn(),
};

vi.mock('@wepublish/editor/api', async importOriginal => ({
  ...((await importOriginal()) as object),
  useArticleQuery: () => articleQueryResult,
  useArticleRevisionListQuery: () => revisionListQueryResult,
  useArticleRevisionPreviewLazyQuery: () => [vi.fn(), { data: undefined }],
  useSettingsListQuery: () => ({}),
  useCreateJwtForWebsiteLoginMutation: () => [vi.fn()],
  useCreateArticleMutation: () => useFakeMutation(),
  useUpdateArticleMutation: () => useFakeMutation(true),
  usePublishArticleMutation: () => useFakeMutation(),
  useRestoreArticleRevisionMutation: () => useFakeMutation(),
  useDiscardArticleDraftMutation: () => useFakeMutation(),
}));

const blockListProps = vi.hoisted(() => ({ disabled: [] as boolean[] }));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...((await importOriginal()) as object),
  createCheckedPermissionComponent:
    () =>
    <T,>(component: T) =>
      component,
  PermissionControl: ({ children }: { children?: unknown }) => children,
  useAuthorisation: () => true,
  useUnsavedChangesDialog: () => () => true,
  BlockList: ({ disabled }: { disabled?: boolean }) => {
    blockListProps.disabled.push(!!disabled);
    return null;
  },
  ArticleMetadataPanel: () => null,
  VersionHistory: () => null,
  PublishArticlePanel: () => null,
  RevisionContentPreview: () => null,
}));

const autosave = vi.hoisted(() => ({
  onAutosave: undefined as undefined | (() => Promise<unknown>),
}));

vi.mock('../../useAutosave', () => ({
  useAutosave: ({ onAutosave }: { onAutosave: () => Promise<unknown> }) => {
    autosave.onAutosave = onAutosave;
    return { markSaved: () => undefined };
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
  Trans: ({ children }: { children?: unknown }) => children,
  initReactI18next: { type: '3rdParty', init: () => undefined },
}));

vi.mock('rsuite', async importOriginal => ({
  ...((await importOriginal()) as object),
  toaster: { push: vi.fn() },
}));

describe('ArticleEditor autosave', () => {
  it('keeps the blocks editable while an autosave is in flight', async () => {
    render(
      <MemoryRouter initialEntries={['/articles/edit/article-1']}>
        <Routes>
          <Route
            path="/articles/edit/:id"
            element={<ArticleEditor />}
          />
        </Routes>
      </MemoryRouter>
    );

    blockListProps.disabled.length = 0;

    let saving: Promise<unknown> | undefined;
    act(() => {
      saving = autosave.onAutosave?.();
    });

    expect(updateArticleCalls).toHaveLength(1);
    expect(blockListProps.disabled.length).toBeGreaterThan(0);
    expect(blockListProps.disabled).not.toContain(true);

    await act(async () => {
      updateArticleCalls[0]();
      await saving;
    });

    expect(blockListProps.disabled).not.toContain(true);
  });
});
