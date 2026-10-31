import { useMutation, useQuery } from '@apollo/client/react';
import {
  CreatePageDocument,
  PageDocument,
  PageRevisionListDocument,
  PublishPageDocument,
  RestorePageRevisionDocument,
  UpdatePageDocument,
} from '@wepublish/editor/api';
import {
  CanCreatePage,
  CanDeletePage,
  CanGetPage,
  CanGetPages,
  CanPreview,
  CanPublishPage,
} from '@wepublish/permissions';
import {
  PuckDocumentController,
  PuckRevisionHistory,
  RevisionHistoryPlugin,
} from '@wepublish/puck-content/editor';
import { PuckData, toApiDocument } from '@wepublish/puck-content/website';
import {
  createCheckedPermissionComponent,
  useHasPermission,
} from '@wepublish/ui/editor';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdLink } from 'react-icons/md';
import { useNavigate, useParams } from 'react-router-dom';

import { copyLinkToClipboard } from '../../copyLink';
import { useAutosaveEnabled } from '../../useAutosaveEnabled';
import {
  loadPuckDocument,
  pageToRootProps,
  toCreatePageVariables,
  toUpdatePageVariables,
} from './puck-document-mapping';
import {
  hasUnpublishedChanges,
  pagePublishDialog,
  puckDocumentStatus,
  puckDocumentStatusLabel,
} from './puck-document-status';
import { PuckDocumentEditor } from './puck-editor';
import {
  notifyFailure,
  notifySuccess,
  REVISIONS_PAGE_SIZE,
} from './puck-editor.notify';
import { PuckEditorError, PuckEditorLoading } from './puck-editor-status';

function PageEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [autosaveEnabled, setAutosaveEnabled] = useAutosaveEnabled();
  const [historyRequested, setHistoryRequested] = useState(false);
  const [restoreCount, setRestoreCount] = useState(0);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [loadingMoreRevisions, setLoadingMoreRevisions] = useState(false);

  const canSave = useHasPermission([CanCreatePage.id]);
  const canPublish = useHasPermission([CanPublishPage.id]);
  const canPreview = useHasPermission([CanPreview.id]);
  const canSeeHistory = useHasPermission([CanGetPage.id]);

  const { data, loading, refetch } = useQuery(PageDocument, {
    errorPolicy: 'all',
    variables: { id: id ?? '' },
    skip: !id,
  });

  const [createPage, { loading: creating }] = useMutation(CreatePageDocument, {
    update: (cache, { data: created }) => {
      if (created) {
        cache.writeQuery({
          query: PageDocument,
          variables: { id: created.createPage.id },
          data: { __typename: 'Query', page: created.createPage },
        });
      }
    },
  });
  const [updatePage, { loading: updating }] = useMutation(UpdatePageDocument);
  const [publishPage, { loading: publishing }] =
    useMutation(PublishPageDocument);
  const [restorePageRevision, { loading: restoring }] = useMutation(
    RestorePageRevisionDocument
  );

  const {
    data: revisionsData,
    loading: revisionsLoading,
    refetch: refetchRevisions,
    fetchMore: fetchMoreRevisions,
  } = useQuery(PageRevisionListDocument, {
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    variables: { id: id ?? '', take: REVISIONS_PAGE_SIZE, skip: 0 },
    skip: !id || !historyRequested || !canSeeHistory,
  });

  const page = data?.page ?? undefined;

  const loaded = useMemo(
    () =>
      loadPuckDocument(
        'page',
        page?.latest.puckBlocks,
        page ? pageToRootProps(page) : {}
      ),
    [page]
  );

  const backTo = '/pages';
  const backLabel = t('back');

  if (id && !page) {
    return loading ?
        <PuckEditorLoading />
      : <PuckEditorError
          message={t('pageEditor.overview.pageNotFound')}
          backTo={backTo}
          backLabel={backLabel}
        />;
  }

  const { data: initialData } = loaded;

  if (!initialData) {
    return (
      <PuckEditorError
        message={t('puck.loadFailed')}
        backTo={backTo}
        backLabel={backLabel}
      />
    );
  }

  const refresh = () =>
    Promise.allSettled([
      refetch(),
      historyRequested ? refetchRevisions() : undefined,
    ]);

  const save = async (document: PuckData<'page'>) => {
    try {
      const apiDocument = toApiDocument('page', document);

      if (!page) {
        const { data: created } = await createPage({
          variables: toCreatePageVariables(apiDocument),
        });

        notifySuccess(t('pageEditor.overview.pageDraftCreated'));

        if (created) {
          navigate(`/puck/pages/edit/${created.createPage.id}`, {
            replace: true,
          });
        }

        return;
      }

      await updatePage({
        variables: toUpdatePageVariables(page.id, apiDocument),
      });
      notifySuccess(t('pageEditor.overview.pageDraftSaved'));
    } catch (error) {
      notifyFailure(error);
      throw error;
    }

    await refresh();
  };

  const publish = async (document: PuckData<'page'>, publishedAt: Date) => {
    if (!page) {
      return;
    }

    try {
      const apiDocument = toApiDocument('page', document);

      await updatePage({
        variables: toUpdatePageVariables(page.id, apiDocument),
      });
      await publishPage({
        variables: { id: page.id, publishedAt: publishedAt.toISOString() },
      });
      notifySuccess(
        t(
          publishedAt <= new Date() ?
            'pageEditor.overview.pagePublished'
          : 'pageEditor.overview.pagePending'
        )
      );
    } catch (error) {
      notifyFailure(error);
      throw error;
    }

    await refresh();
  };

  const restore = async (revisionId: string) => {
    if (!page) {
      return;
    }

    setRestoringId(revisionId);

    try {
      await restorePageRevision({ variables: { id: page.id, revisionId } });
      setRestoreCount(count => count + 1);
      notifySuccess(t('versionHistory.restored'));
    } catch (error) {
      notifyFailure(error);
    } finally {
      setRestoringId(null);
    }

    await refresh();
  };

  const revisionNodes = revisionsData?.pageRevisions?.nodes ?? [];

  const loadMoreRevisions = async () => {
    setLoadingMoreRevisions(true);

    try {
      await fetchMoreRevisions({
        variables: { skip: revisionNodes.length },
        updateQuery: (previous, { fetchMoreResult }) => {
          if (!fetchMoreResult?.pageRevisions) {
            return previous;
          }

          return {
            ...previous,
            pageRevisions: {
              ...fetchMoreResult.pageRevisions,
              nodes: [
                ...(previous.pageRevisions?.nodes ?? []),
                ...fetchMoreResult.pageRevisions.nodes,
              ],
            },
          };
        },
      });
    } finally {
      setLoadingMoreRevisions(false);
    }
  };

  const revisionHistory: PuckRevisionHistory | undefined =
    page && canSeeHistory ?
      {
        revisions: revisionNodes.map(revision => ({
          id: revision.id,
          createdAt: revision.createdAt,
          publishedAt: revision.publishedAt,
          archivedAt: revision.archivedAt,
          title: revision.title,
          subtitle: revision.description,
          author: revision.user,
        })),
        draftId: page.draft?.id,
        pendingId: page.pending?.id,
        publishedId: page.published?.id,
        loading: revisionsLoading && revisionNodes.length === 0,
        restoringId,
        canRestore: canSave,
        totalCount: revisionsData?.pageRevisions?.totalCount,
        hasMore: !!revisionsData?.pageRevisions?.pageInfo?.hasNextPage,
        loadingMore: loadingMoreRevisions,
        onLoadMore: loadMoreRevisions,
        onRestore: restore,
      }
    : undefined;

  const publishedUrl = page?.published ? page.url : undefined;

  const controller: PuckDocumentController = {
    backTo,
    backLabel,
    status: puckDocumentStatus(page),
    statusLabel: puckDocumentStatusLabel(t, 'page', page),
    lastSavedAt: page ? new Date(page.latest.createdAt) : undefined,
    isNew: !page,
    busy: loading || creating || updating || publishing || restoring,
    hasUnpublishedChanges: hasUnpublishedChanges(page),
    canSave,
    canPublish,
    previewUrl: canPreview ? page?.previewUrl : undefined,
    publishDialog: pagePublishDialog(
      t,
      page,
      page ? pageToRootProps(page) : {}
    ),
    autosave: { enabled: autosaveEnabled, onToggle: setAutosaveEnabled },
    menuActions:
      publishedUrl ?
        [
          {
            label: t('copyLink.button'),
            icon: <MdLink />,
            onClick: () => copyLinkToClipboard(publishedUrl, t),
          },
        ]
      : [],
    onSave: save,
    onPublish: publish,
  };

  return (
    <PuckDocumentEditor
      key={`${page?.id ?? 'new'}:${restoreCount}`}
      kind="page"
      data={initialData}
      controller={controller}
      publishDialogOf={rootProps => pagePublishDialog(t, page, rootProps)}
      revisionHistory={revisionHistory}
      initialPlugin={restoreCount ? RevisionHistoryPlugin.name : undefined}
      onPluginChange={plugin => {
        if (plugin === RevisionHistoryPlugin.name) {
          setHistoryRequested(true);
        }
      }}
    />
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetPage.id,
  CanGetPages.id,
  CanCreatePage.id,
  CanPublishPage.id,
  CanDeletePage.id,
  CanPreview.id,
])(PageEditor);

export { CheckedPermissionComponent as PuckPageEditor };
