import { useMutation, useQuery } from '@apollo/client/react';
import {
  ArticleDocument,
  ArticleRevisionListDocument,
  CreateArticleDocument,
  PublishArticleDocument,
  RestoreArticleRevisionDocument,
  UpdateArticleDocument,
} from '@wepublish/editor/api';
import {
  CanCreateArticle,
  CanDeleteArticle,
  CanGetArticle,
  CanGetArticles,
  CanPreview,
  CanPublishArticle,
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
  articleToRootProps,
  loadPuckDocument,
  toCreateArticleVariables,
  toUpdateArticleVariables,
} from './puck-document-mapping';
import {
  articlePublishDialog,
  hasUnpublishedChanges,
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

function ArticleEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [autosaveEnabled, setAutosaveEnabled] = useAutosaveEnabled();
  const [historyRequested, setHistoryRequested] = useState(false);
  const [restoreCount, setRestoreCount] = useState(0);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [loadingMoreRevisions, setLoadingMoreRevisions] = useState(false);

  const canSave = useHasPermission([CanCreateArticle.id]);
  const canPublish = useHasPermission([CanPublishArticle.id]);
  const canPreview = useHasPermission([CanPreview.id]);
  const canSeeHistory = useHasPermission([CanGetArticle.id]);

  const { data, loading, refetch } = useQuery(ArticleDocument, {
    errorPolicy: 'all',
    variables: { id: id ?? '' },
    skip: !id,
  });

  const [createArticle, { loading: creating }] = useMutation(
    CreateArticleDocument,
    {
      update: (cache, { data: created }) => {
        if (created) {
          cache.writeQuery({
            query: ArticleDocument,
            variables: { id: created.createArticle.id },
            data: { __typename: 'Query', article: created.createArticle },
          });
        }
      },
    }
  );
  const [updateArticle, { loading: updating }] = useMutation(
    UpdateArticleDocument
  );
  const [publishArticle, { loading: publishing }] = useMutation(
    PublishArticleDocument
  );
  const [restoreArticleRevision, { loading: restoring }] = useMutation(
    RestoreArticleRevisionDocument
  );

  const {
    data: revisionsData,
    loading: revisionsLoading,
    refetch: refetchRevisions,
    fetchMore: fetchMoreRevisions,
  } = useQuery(ArticleRevisionListDocument, {
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    variables: { id: id ?? '', take: REVISIONS_PAGE_SIZE, skip: 0 },
    skip: !id || !historyRequested || !canSeeHistory,
  });

  const article = data?.article ?? undefined;

  const loaded = useMemo(
    () =>
      loadPuckDocument(
        'article',
        article?.latest.puckBlocks,
        article ? articleToRootProps(article) : {}
      ),
    [article]
  );

  const backTo = '/articles';
  const backLabel = t('articleEditor.overview.back');

  if (id && !article) {
    return loading ?
        <PuckEditorLoading />
      : <PuckEditorError
          message={t('articleEditor.overview.notFound')}
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

  const save = async (document: PuckData<'article'>) => {
    try {
      const apiDocument = toApiDocument('article', document);

      if (!article) {
        const { data: created } = await createArticle({
          variables: toCreateArticleVariables(apiDocument),
        });

        notifySuccess(t('articleEditor.overview.draftCreated'));

        if (created) {
          navigate(`/puck/articles/edit/${created.createArticle.id}`, {
            replace: true,
          });
        }

        return;
      }

      await updateArticle({
        variables: toUpdateArticleVariables(article.id, apiDocument, article),
      });
      notifySuccess(t('articleEditor.overview.draftSaved'));
    } catch (error) {
      notifyFailure(error);
      throw error;
    }

    await refresh();
  };

  const publish = async (document: PuckData<'article'>, publishedAt: Date) => {
    if (!article) {
      return;
    }

    try {
      const apiDocument = toApiDocument('article', document);

      if (!apiDocument.rootProps.slug) {
        throw new Error(t('articleEditor.overview.noSlug'));
      }

      await updateArticle({
        variables: toUpdateArticleVariables(article.id, apiDocument, article),
      });
      await publishArticle({
        variables: { id: article.id, publishedAt: publishedAt.toISOString() },
      });
      notifySuccess(
        t(
          publishedAt <= new Date() ?
            'articleEditor.overview.articlePublished'
          : 'articleEditor.overview.articlePending'
        )
      );
    } catch (error) {
      notifyFailure(error);
      throw error;
    }

    await refresh();
  };

  const restore = async (revisionId: string) => {
    if (!article) {
      return;
    }

    setRestoringId(revisionId);

    try {
      await restoreArticleRevision({
        variables: { id: article.id, revisionId },
      });
      setRestoreCount(count => count + 1);
      notifySuccess(t('versionHistory.restored'));
    } catch (error) {
      notifyFailure(error);
    } finally {
      setRestoringId(null);
    }

    await refresh();
  };

  const revisionNodes = revisionsData?.articleRevisions?.nodes ?? [];

  const loadMoreRevisions = async () => {
    setLoadingMoreRevisions(true);

    try {
      await fetchMoreRevisions({
        variables: { skip: revisionNodes.length },
        updateQuery: (previous, { fetchMoreResult }) => {
          if (!fetchMoreResult?.articleRevisions) {
            return previous;
          }

          return {
            ...previous,
            articleRevisions: {
              ...fetchMoreResult.articleRevisions,
              nodes: [
                ...(previous.articleRevisions?.nodes ?? []),
                ...fetchMoreResult.articleRevisions.nodes,
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
    article && canSeeHistory ?
      {
        revisions: revisionNodes.map(revision => ({
          id: revision.id,
          createdAt: revision.createdAt,
          publishedAt: revision.publishedAt,
          archivedAt: revision.archivedAt,
          title: revision.title,
          subtitle: revision.preTitle || revision.lead,
          author: revision.user,
        })),
        draftId: article.draft?.id,
        pendingId: article.pending?.id,
        publishedId: article.published?.id,
        loading: revisionsLoading && revisionNodes.length === 0,
        restoringId,
        canRestore: canSave,
        totalCount: revisionsData?.articleRevisions?.totalCount,
        hasMore: !!revisionsData?.articleRevisions?.pageInfo?.hasNextPage,
        loadingMore: loadingMoreRevisions,
        onLoadMore: loadMoreRevisions,
        onRestore: restore,
      }
    : undefined;

  const publishedUrl = article?.published ? article.url : undefined;

  const controller: PuckDocumentController = {
    backTo,
    backLabel,
    status: puckDocumentStatus(article),
    statusLabel: puckDocumentStatusLabel(t, 'article', article),
    lastSavedAt: article ? new Date(article.latest.createdAt) : undefined,
    isNew: !article,
    busy: loading || creating || updating || publishing || restoring,
    hasUnpublishedChanges: hasUnpublishedChanges(article),
    canSave,
    canPublish,
    previewUrl: canPreview ? article?.previewUrl : undefined,
    publishDialog: articlePublishDialog(
      t,
      article,
      article ? articleToRootProps(article) : {}
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
      key={`${article?.id ?? 'new'}:${restoreCount}`}
      kind="article"
      data={initialData}
      controller={controller}
      publishDialogOf={rootProps => articlePublishDialog(t, article, rootProps)}
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
  CanGetArticle.id,
  CanGetArticles.id,
  CanCreateArticle.id,
  CanDeleteArticle.id,
])(ArticleEditor);

export { CheckedPermissionComponent as PuckArticleEditor };
