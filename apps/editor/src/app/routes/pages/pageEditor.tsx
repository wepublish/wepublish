import styled from '@emotion/styled';
import {
  Button as MuiButton,
  Dialog as MuiDialog,
  DialogActions as MuiDialogActions,
  DialogContent as MuiDialogContent,
  DialogContentText as MuiDialogContentText,
  DialogTitle as MuiDialogTitle,
} from '@mui/material';
import {
  CreatePageMutationVariables,
  useCreateJwtForWebsiteLoginMutation,
  useCreatePageMutation,
  useDiscardPageDraftMutation,
  usePageQuery,
  usePageRevisionListQuery,
  usePageRevisionPreviewLazyQuery,
  usePublishPageMutation,
  useRestorePageRevisionMutation,
  useUpdatePageMutation,
} from '@wepublish/editor/api';
import { CanPreview } from '@wepublish/permissions';
import type { AggregatedValidation } from '@wepublish/ui/editor';
import {
  blockForQueryBlock,
  BlockList,
  BlockMap,
  BlockValue,
  createCheckedPermissionComponent,
  EditorTemplate,
  EditorValidationProvider,
  mapBlockValueToBlockInput,
  NavigationBar,
  PageMetadata,
  PageMetadataPanel,
  PermissionControl,
  PublishPagePanel,
  RevisionContentPreview,
  StateColor,
  TeaserOverviewPanel,
  useAuthorisation,
  useUnsavedChangesDialog,
  VersionHistory,
  VersionHistoryRevision,
} from '@wepublish/ui/editor';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdCloudUpload,
  MdDeleteOutline,
  MdHistory,
  MdIntegrationInstructions,
  MdKeyboardBackspace,
  MdRemoveRedEye,
  MdSave,
} from 'react-icons/md';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Badge,
  Drawer,
  IconButton as RIconButton,
  Message,
  Modal,
  Notification,
  Tag as RTag,
  toaster,
} from 'rsuite';

const EditorContent = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const TeaserOverviewWrapper = styled.div`
  padding-left: 46px;
  padding-right: 160px;
`;

const IconButtonMargins = styled(RIconButton)`
  margin-top: 4px;
  margin-bottom: 20px;
`;

const IconButtonMTop = styled(RIconButton)`
  margin-top: 4px;
`;

const IconButton = styled(RIconButton)`
  margin-left: 10px;
`;

const CenterChildren = styled.div`
  margin-top: 4px;
`;

const Legend = styled.legend`
  width: auto;
  margin: 0px auto;
`;

const FieldSet = styled('fieldset', {
  shouldForwardProp: prop => prop !== 'stateColor',
})<{ stateColor: string }>`
  border-color: ${({ stateColor }) => stateColor};
`;

const Tag = styled(RTag, {
  shouldForwardProp: prop => prop !== 'stateColor',
})<{ stateColor: string }>`
  background-color: ${({ stateColor }) => stateColor};
`;

const REVISIONS_PAGE_SIZE = 20;

function PageEditor() {
  const navigate = useNavigate();
  const params = useParams();
  const { id } = params;

  const [
    createPage,
    { data: createData, loading: isCreating, error: createError },
  ] = useCreatePageMutation();
  const [updatePage, { loading: isUpdating, error: updateError }] =
    useUpdatePageMutation();
  const [publishPage, { loading: isPublishing, error: publishError }] =
    usePublishPageMutation({});
  const [restorePageRevision, { loading: isRestoring, error: restoreError }] =
    useRestorePageRevisionMutation({});
  const [discardPageDraft, { loading: isDiscarding, error: discardError }] =
    useDiscardPageDraftMutation({});

  const [isMetaDrawerOpen, setMetaDrawerOpen] = useState(false);
  const [isPublishDialogOpen, setPublishDialogOpen] = useState(false);
  const [isVersionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [isVersionHistoryRequested, setVersionHistoryRequested] =
    useState(false);
  const [isDiscardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [isLoadingMoreRevisions, setLoadingMoreRevisions] = useState(false);
  const [previewRevisionId, setPreviewRevisionId] = useState<string | null>(
    null
  );
  const [restoringRevisionId, setRestoringRevisionId] = useState<string | null>(
    null
  );

  const [publishedAt, setPublishedAt] = useState<Date>();
  const [metadata, setMetadata] = useState<PageMetadata>({
    slug: '',
    title: '',
    description: '',
    tags: [],
    defaultTags: [],
    url: '',
    properties: [],
    hidden: false,
    image: undefined,
    socialMediaTitle: undefined,
    socialMediaDescription: undefined,
    socialMediaImage: undefined,
  });

  const isNew = id === undefined;
  const [blocks, setBlocks] = useState<BlockValue[]>([]);

  const pageID = id || createData?.createPage.id;

  const {
    data: pageData,
    refetch,
    loading: isLoading,
  } = usePageQuery({
    errorPolicy: 'all',
    variables: { id: pageID! },
    skip: !pageID,
  });
  const [createJWT] = useCreateJwtForWebsiteLoginMutation({
    errorPolicy: 'none',
    fetchPolicy: 'no-cache',
  });

  const {
    data: revisionsData,
    refetch: refetchRevisions,
    fetchMore: fetchMoreRevisions,
    loading: isRevisionsLoading,
  } = usePageRevisionListQuery({
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    variables: { id: pageID!, take: REVISIONS_PAGE_SIZE, skip: 0 },
    skip: !pageID || !isVersionHistoryRequested,
  });

  const revisionNodes = revisionsData?.pageRevisions?.nodes ?? [];

  const revisions: VersionHistoryRevision[] = revisionNodes.map(revision => ({
    id: revision.id,
    createdAt: revision.createdAt,
    publishedAt: revision.publishedAt,
    archivedAt: revision.archivedAt,
    title: revision.title,
    subtitle: revision.description,
    author: revision.user,
  }));

  const reloadRevisions = () =>
    isVersionHistoryRequested ? refetchRevisions() : Promise.resolve();

  async function loadMoreRevisions() {
    setLoadingMoreRevisions(true);

    try {
      await fetchMoreRevisions({
        variables: { skip: revisionNodes.length },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult?.pageRevisions) {
            return prev;
          }

          return {
            ...prev,
            pageRevisions: {
              ...fetchMoreResult.pageRevisions,
              nodes: [
                ...(prev.pageRevisions?.nodes ?? []),
                ...fetchMoreResult.pageRevisions.nodes,
              ],
            },
          };
        },
      });
    } finally {
      setLoadingMoreRevisions(false);
    }
  }

  const [
    loadRevisionPreview,
    { data: previewData, loading: isPreviewLoading },
  ] = usePageRevisionPreviewLazyQuery({ errorPolicy: 'all' });

  function handlePreviewRevision(revisionId: string) {
    setPreviewRevisionId(revisionId);
    loadRevisionPreview({ variables: { id: revisionId } });
  }

  const previewRevision =
    previewData?.pageRevision?.id === previewRevisionId ?
      previewData?.pageRevision
    : undefined;

  const { t } = useTranslation();

  const isNotFound = pageData && !pageData.page;
  const isDisabled =
    isLoading ||
    isCreating ||
    isUpdating ||
    isPublishing ||
    isRestoring ||
    isDiscarding ||
    isNotFound;
  const canPreview = Boolean(pageData?.page?.draft);

  const [hasChanged, setChanged] = useState(false);
  const unsavedChangesDialog = useUnsavedChangesDialog(hasChanged);

  const isAuthorized = useAuthorisation('CAN_CREATE_PAGE');

  const handleChange = useCallback(
    (blocks: React.SetStateAction<BlockValue[]>) => {
      setBlocks(blocks);
      setChanged(true);
    },
    []
  );

  useEffect(() => {
    if (pageData?.page && !hasChanged) {
      const { latest, tags, hidden, slug, url } = pageData.page;
      const {
        title,
        description,
        image,
        blocks,
        properties,
        socialMediaTitle,
        socialMediaDescription,
        socialMediaImage,
        publishedAt,
      } = latest;

      if (publishedAt) {
        setPublishedAt(new Date(publishedAt));
      }

      setMetadata({
        slug: slug ?? '',
        title: title ?? '',
        description: description ?? '',
        tags: tags.map(({ id }) => id),
        defaultTags: tags,
        url,
        properties,
        hidden,
        image: image || undefined,
        socialMediaTitle: socialMediaTitle || '',
        socialMediaDescription: socialMediaDescription || '',
        socialMediaImage: socialMediaImage || undefined,
      });

      setBlocks(blocks.map(blockForQueryBlock));
    }
  }, [pageData]);

  const [stateColor, setStateColor] = useState<StateColor>(StateColor.none);
  const [tagTitle, setTagTitle] = useState<string>('');

  useEffect(() => {
    if (pageData?.page?.pending) {
      setStateColor(StateColor.pending);
      setTagTitle(
        t('pageEditor.overview.pending', {
          date: new Date(pageData?.page?.pending?.publishedAt ?? ''),
        })
      );
    } else if (pageData?.page?.latest.publishedAt) {
      setStateColor(StateColor.published);
      setTagTitle(
        t('pageEditor.overview.published', {
          date: new Date(pageData?.page?.latest?.publishedAt ?? ''),
        })
      );
    } else {
      setStateColor(StateColor.draft);
      setTagTitle(t('pageEditor.overview.unpublished'));
    }
  }, [pageData, hasChanged, t]);

  useEffect(() => {
    const error =
      createError?.message ??
      updateError?.message ??
      publishError?.message ??
      restoreError?.message ??
      discardError?.message;
    if (error)
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={0}
        >
          {error}
        </Message>
      );
  }, [createError, updateError, publishError, restoreError, discardError]);

  async function handleDiscardDraft() {
    if (!pageID) {
      return;
    }

    const { data } = await discardPageDraft({
      variables: { id: pageID },
    });

    if (data) {
      setChanged(false);
      await Promise.all([refetch({ id: pageID }), reloadRevisions()]);

      toaster.push(
        <Notification
          type="success"
          header={t('discardDraft.success')}
          duration={2000}
        />,
        { placement: 'topEnd' }
      );
    }
  }

  async function handleRestoreRevision(revisionId: string) {
    if (!pageID) {
      return;
    }

    setRestoringRevisionId(revisionId);

    try {
      const { data } = await restorePageRevision({
        variables: { id: pageID, revisionId },
      });

      if (data) {
        // Let the page query repopulate the editor with the restored draft.
        setChanged(false);
        await Promise.all([refetch({ id: pageID }), reloadRevisions()]);

        toaster.push(
          <Notification
            type="success"
            header={t('versionHistory.restored')}
            duration={2000}
          />,
          { placement: 'topEnd' }
        );

        setVersionHistoryOpen(false);
      }
    } finally {
      setRestoringRevisionId(null);
    }
  }

  function createInput(): CreatePageMutationVariables {
    return {
      slug: metadata.slug ?? '',
      title: metadata.title ?? '',
      description: metadata.description,
      hidden: metadata.hidden ?? false,
      imageID: metadata.image?.id,
      tagIds: metadata.tags,
      properties: metadata.properties,
      socialMediaTitle: metadata.socialMediaTitle || undefined,
      socialMediaDescription: metadata.socialMediaDescription || undefined,
      socialMediaImageID: metadata.socialMediaImage?.id || undefined,
      blocks: blocks.map(mapBlockValueToBlockInput),
    };
  }

  const validateAll = useRef<() => AggregatedValidation>(() => ({
    ok: true,
    failures: [],
  }));

  function runEditorValidation(reason: 'save' | 'publish' = 'save'): boolean {
    const result = validateAll.current();
    if (result.ok) {
      return true;
    }
    const summaries = result.failures
      .map(f => f.summary)
      .filter(Boolean)
      .join(' · ');
    const header =
      reason === 'publish' ?
        t('pageEditor.publishValidationFailed')
      : t('pageEditor.saveValidationFailed');
    toaster.push(
      <Message
        type="error"
        showIcon={false}
        closable
        duration={5000}
      >
        <strong>{header}</strong>
        <div>{summaries || t('pageEditor.validationFailedGeneric')}</div>
      </Message>,
      { placement: 'topEnd' }
    );
    return false;
  }

  async function handleSave() {
    if (!runEditorValidation('save')) {
      return;
    }
    const input = createInput();

    if (pageID) {
      await updatePage({ variables: { id: pageID, ...input } });

      setChanged(false);
      toaster.push(
        <Notification
          type="success"
          header={t('pageEditor.overview.pageDraftSaved')}
          duration={2000}
        />,
        { placement: 'topEnd' }
      );
      await Promise.all([refetch({ id: pageID }), reloadRevisions()]);
    } else {
      const { data } = await createPage({ variables: input });

      if (data) {
        navigate(`/pages/edit/${data?.createPage.id}`, { replace: true });
      }
      setChanged(false);
      toaster.push(
        <Notification
          type="success"
          header={t('pageEditor.overview.pageDraftCreated')}
          duration={2000}
        />,
        { placement: 'topEnd' }
      );
    }
  }

  async function handlePublish(publishedAt: Date) {
    if (!runEditorValidation('publish')) {
      return;
    }
    if (pageID) {
      const { data } = await updatePage({
        variables: { id: pageID, ...createInput() },
      });

      if (data) {
        const { data: publishData } = await publishPage({
          variables: {
            id: pageID,
            publishedAt: publishedAt.toISOString(),
          },
        });

        if (publishData?.publishPage?.latest?.publishedAt) {
          setPublishedAt(
            new Date(publishData?.publishPage?.latest.publishedAt)
          );
        }
      }
      await Promise.all([refetch({ id: pageID }), reloadRevisions()]);
    }

    setChanged(false);
    toaster.push(
      <Notification
        type="success"
        header={t(
          publishedAt <= new Date() ?
            'pageEditor.overview.pagePublished'
          : 'pageEditor.overview.pagePending'
        )}
        duration={2000}
      />,
      { placement: 'topEnd' }
    );
  }

  useEffect(() => {
    if (isNotFound) {
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={0}
        >
          {t('pageEditor.overview.pageNotFound')}
        </Message>
      );
    }
  }, [isNotFound, t]);

  return (
    <>
      <FieldSet stateColor={stateColor}>
        <Legend>
          <Tag stateColor={stateColor}>{tagTitle}</Tag>
        </Legend>

        <EditorTemplate
          navigationChildren={
            <NavigationBar
              leftChildren={
                <Link to="/pages">
                  <IconButtonMargins
                    className="actionButton"
                    size="lg"
                    icon={<MdKeyboardBackspace />}
                    onClick={e => {
                      if (!unsavedChangesDialog()) e.preventDefault();
                    }}
                  >
                    {t('Back')}
                  </IconButtonMargins>
                </Link>
              }
              centerChildren={
                <CenterChildren>
                  <RIconButton
                    icon={<MdIntegrationInstructions />}
                    className="actionButton"
                    size="lg"
                    disabled={isDisabled}
                    onClick={() => setMetaDrawerOpen(true)}
                  >
                    {t('pageEditor.overview.metadata')}
                  </RIconButton>

                  {!isNew && (
                    <>
                      <PermissionControl
                        qualifyingPermissions={['CAN_GET_PAGE']}
                      >
                        <IconButton
                          className="actionButton"
                          icon={<MdHistory />}
                          size="lg"
                          disabled={isDisabled}
                          onClick={() => {
                            if (isVersionHistoryRequested) {
                              refetchRevisions();
                            }
                            setVersionHistoryRequested(true);
                            setVersionHistoryOpen(true);
                          }}
                        >
                          {t('versionHistory.title')}
                        </IconButton>
                      </PermissionControl>

                      {pageData?.page?.draft && pageData?.page?.published && (
                        <PermissionControl
                          qualifyingPermissions={['CAN_CREATE_PAGE']}
                        >
                          <IconButton
                            className="actionButton"
                            icon={<MdDeleteOutline />}
                            size="lg"
                            disabled={isDisabled}
                            onClick={() => setDiscardDialogOpen(true)}
                          >
                            {t('discardDraft.button')}
                          </IconButton>
                        </PermissionControl>
                      )}
                    </>
                  )}

                  {isNew && createData == null ?
                    <PermissionControl
                      qualifyingPermissions={['CAN_CREATE_PAGE']}
                    >
                      <IconButton
                        className="actionButton"
                        size="lg"
                        icon={<MdSave />}
                        disabled={isDisabled}
                        onClick={handleSave}
                      >
                        {t('create')}
                      </IconButton>
                    </PermissionControl>
                  : <PermissionControl
                      qualifyingPermissions={['CAN_CREATE_PAGE']}
                    >
                      <Badge className={hasChanged ? 'unsaved' : 'saved'}>
                        <IconButton
                          className="actionButton"
                          size="lg"
                          icon={<MdSave />}
                          disabled={isDisabled}
                          onClick={handleSave}
                        >
                          {t('save')}
                        </IconButton>
                      </Badge>
                      <PermissionControl
                        qualifyingPermissions={['CAN_PUBLISH_PAGE']}
                      >
                        <Badge
                          className={
                            (
                              pageData?.page?.draft ||
                              !pageData?.page?.published
                            ) ?
                              'unsaved'
                            : 'saved'
                          }
                        >
                          <IconButton
                            className="actionButton"
                            size="lg"
                            icon={<MdCloudUpload />}
                            disabled={isDisabled}
                            onClick={() => {
                              if (!runEditorValidation('publish')) {
                                return;
                              }
                              setPublishDialogOpen(true);
                            }}
                          >
                            {t('pageEditor.overview.publish')}
                          </IconButton>
                        </Badge>
                      </PermissionControl>
                    </PermissionControl>
                  }
                </CenterChildren>
              }
              rightChildren={
                <PermissionControl qualifyingPermissions={[CanPreview.id]}>
                  <IconButtonMTop
                    className="actionButton"
                    disabled={hasChanged || !id || !canPreview}
                    size="lg"
                    icon={<MdRemoveRedEye />}
                    onClick={async () => {
                      const previewWindow = window.open(
                        pageData!.page.previewUrl,
                        '_blank'
                      );
                      if (!previewWindow) return;

                      const { data: jwtData } = await createJWT();
                      const token = jwtData?.createJWTForWebsiteLogin?.token;
                      if (!token) return;

                      const targetOrigin = new URL(pageData!.page.previewUrl)
                        .origin;

                      const handleMessage = (event: MessageEvent) => {
                        if (
                          event.source === previewWindow &&
                          event.data === 'preview-jwt-ready'
                        ) {
                          previewWindow.postMessage(
                            { previewJwt: token },
                            targetOrigin
                          );
                          window.removeEventListener('message', handleMessage);
                        }
                      };
                      window.addEventListener('message', handleMessage);
                    }}
                  >
                    {t('pageEditor.overview.preview')}
                  </IconButtonMTop>
                </PermissionControl>
              }
            />
          }
        >
          <EditorContent>
            <EditorValidationProvider runAllRef={validateAll}>
              <TeaserOverviewWrapper>
                <TeaserOverviewPanel
                  blocks={blocks}
                  onChange={handleChange}
                />
              </TeaserOverviewWrapper>

              <BlockList
                value={blocks}
                onChange={handleChange}
                disabled={isDisabled || !isAuthorized}
                blockMap={BlockMap}
              />
            </EditorValidationProvider>
          </EditorContent>
        </EditorTemplate>
      </FieldSet>

      <Drawer
        open={isMetaDrawerOpen}
        size="sm"
        onClose={() => setMetaDrawerOpen(false)}
      >
        <PageMetadataPanel
          value={metadata}
          onClose={() => {
            handleSave();
            setMetaDrawerOpen(false);
          }}
          onChange={value => {
            setMetadata(value);
            setChanged(true);
          }}
        />
      </Drawer>

      <Modal
        open={isPublishDialogOpen}
        size="sm"
        onClose={() => setPublishDialogOpen(false)}
      >
        <PublishPagePanel
          publishedAtDate={publishedAt}
          metadata={metadata}
          onClose={() => setPublishDialogOpen(false)}
          onConfirm={publishedAt => {
            handlePublish(publishedAt);
            setPublishDialogOpen(false);
          }}
        />
      </Modal>

      <VersionHistory
        open={isVersionHistoryOpen}
        onClose={() => setVersionHistoryOpen(false)}
        loading={isRevisionsLoading && revisions.length === 0}
        revisions={revisions}
        totalCount={revisionsData?.pageRevisions?.totalCount}
        hasMore={!!revisionsData?.pageRevisions?.pageInfo?.hasNextPage}
        loadingMore={isLoadingMoreRevisions}
        onLoadMore={loadMoreRevisions}
        draftId={pageData?.page?.draft?.id}
        pendingId={pageData?.page?.pending?.id}
        publishedId={pageData?.page?.published?.id}
        restoringId={restoringRevisionId}
        canRestore={isAuthorized}
        onRestore={handleRestoreRevision}
        onPreview={handlePreviewRevision}
      />

      <RevisionContentPreview
        open={!!previewRevisionId}
        loading={isPreviewLoading || !previewRevision}
        onClose={() => setPreviewRevisionId(null)}
        title={previewRevision?.title}
        subtitle={previewRevision?.description}
        blocks={(previewRevision?.blocks ?? []).map(blockForQueryBlock)}
      />

      <MuiDialog
        open={isDiscardDialogOpen}
        onClose={() => setDiscardDialogOpen(false)}
      >
        <MuiDialogTitle>{t('discardDraft.confirm.title')}</MuiDialogTitle>
        <MuiDialogContent>
          <MuiDialogContentText>
            {t('discardDraft.confirm.message')}
          </MuiDialogContentText>
        </MuiDialogContent>
        <MuiDialogActions>
          <MuiButton onClick={() => setDiscardDialogOpen(false)}>
            {t('discardDraft.confirm.cancel')}
          </MuiButton>
          <MuiButton
            color="error"
            variant="contained"
            startIcon={<MdDeleteOutline />}
            onClick={() => {
              setDiscardDialogOpen(false);
              handleDiscardDraft();
            }}
          >
            {t('discardDraft.confirm.confirm')}
          </MuiButton>
        </MuiDialogActions>
      </MuiDialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_PAGE',
  'CAN_GET_PAGES',
  'CAN_CREATE_PAGE',
  'CAN_PUBLISH_PAGE',
  'CAN_DELETE_PAGE',
  CanPreview.id,
])(PageEditor);
export { CheckedPermissionComponent as PageEditor };
