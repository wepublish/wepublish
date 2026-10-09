import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
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
  CreateJwtForWebsiteLoginDocument,
  CreatePageDocument,
  CreatePageMutationVariables,
  DiscardPageDraftDocument,
  PageDocument,
  PageRevisionListDocument,
  PageRevisionPreviewDocument,
  PublishPageDocument,
  RestorePageRevisionDocument,
  UpdatePageDocument,
} from '@wepublish/editor/api';
import { CanPreview } from '@wepublish/permissions';
import type { AggregatedValidation } from '@wepublish/ui/editor';
import {
  blockForQueryBlock,
  BlockList,
  BlockMap,
  BlockValue,
  createCheckedPermissionComponent,
  DocumentUrlProvider,
  EditorHeader,
  EditorHeaderButton,
  EditorTemplate,
  EditorValidationProvider,
  mapBlockValueToBlockInput,
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
  MdEdit,
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
  toaster,
} from 'rsuite';

import { LastSavedAt } from '../../lastSavedAt';
import {
  PreviewControls,
  PreviewDevice,
  PreviewFrame,
} from '../../previewFrame';
import { useAutosave } from '../../useAutosave';

const EditorContent = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;

  &[hidden] {
    display: none;
  }
`;

const TeaserOverviewWrapper = styled.div`
  padding-left: 46px;
  padding-right: 160px;

  @media (max-width: 899px) {
    padding: 0;
  }
`;

const REVISIONS_PAGE_SIZE = 20;

function PageEditor() {
  const navigate = useNavigate();
  const params = useParams();
  const { id } = params;

  const [
    createPage,
    { data: createData, loading: isCreating, error: createError },
  ] = useMutation(CreatePageDocument);
  const [updatePage, { loading: isUpdating, error: updateError }] =
    useMutation(UpdatePageDocument);
  const [autosavePage, { loading: isAutosaving, error: autosaveError }] =
    useMutation(UpdatePageDocument);
  const [publishPage, { loading: isPublishing, error: publishError }] =
    useMutation(PublishPageDocument, {});
  const [restorePageRevision, { loading: isRestoring, error: restoreError }] =
    useMutation(RestorePageRevisionDocument, {});
  const [discardPageDraft, { loading: isDiscarding, error: discardError }] =
    useMutation(DiscardPageDraftDocument, {});

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
  const [isPreviewOpen, setPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop');

  const [publishedAt, setPublishedAt] = useState<Date>();
  const [metadata, setMetadata] = useState<PageMetadata>({
    slug: '',
    title: '',
    description: '',
    seoTitle: '',
    seoDescription: '',
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
  } = useQuery(PageDocument, {
    errorPolicy: 'all',
    variables: { id: pageID! },
    skip: !pageID,
  });
  const [createJWT] = useMutation(CreateJwtForWebsiteLoginDocument, {
    errorPolicy: 'none',
    fetchPolicy: 'no-cache',
  });

  const {
    data: revisionsData,
    refetch: refetchRevisions,
    fetchMore: fetchMoreRevisions,
    loading: isRevisionsLoading,
  } = useQuery(PageRevisionListDocument, {
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
  ] = useLazyQuery(PageRevisionPreviewDocument, { errorPolicy: 'all' });

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
  const isBusy =
    isLoading ||
    isCreating ||
    isUpdating ||
    isPublishing ||
    isRestoring ||
    isDiscarding ||
    isNotFound;
  // Autosaving must not disable the blocks, as that would blur whatever the user is typing in.
  const isDisabled = isBusy || isAutosaving;
  const canPreview = Boolean(
    pageData?.page?.draft ||
      pageData?.page?.published ||
      pageData?.page?.pending
  );

  const [hasChanged, setChanged] = useState(false);
  const changeVersion = useRef(0);
  const skipRepopulate = useRef(false);
  const unsavedChangesDialog = useUnsavedChangesDialog(hasChanged);

  const previewUrl = pageData?.page?.previewUrl;
  const isPreviewDisabled = hasChanged || !id || !canPreview || !previewUrl;
  const showPreview = isPreviewOpen && !isPreviewDisabled;

  const isAuthorized = useAuthorisation('CAN_CREATE_PAGE');

  const handleChange = useCallback(
    (blocks: React.SetStateAction<BlockValue[]>) => {
      setBlocks(blocks);
      changeVersion.current++;
      setChanged(true);
    },
    []
  );

  useEffect(() => {
    if (pageData?.page && !hasChanged && !skipRepopulate.current) {
      const { latest, tags, hidden, slug, url } = pageData.page;
      const {
        title,
        description,
        seoTitle,
        seoDescription,
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
        seoTitle: seoTitle ?? '',
        seoDescription: seoDescription ?? '',
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
      autosaveError?.message ??
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
  }, [
    createError,
    updateError,
    autosaveError,
    publishError,
    restoreError,
    discardError,
  ]);

  async function handleDiscardDraft() {
    if (!pageID) {
      return;
    }

    const { data } = await discardPageDraft({
      variables: { id: pageID },
    });

    if (data) {
      skipRepopulate.current = false;
      markSaved();
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
        skipRepopulate.current = false;
        markSaved();
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
      seoTitle: metadata.seoTitle || undefined,
      seoDescription: metadata.seoDescription || undefined,
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
        duration={8000}
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

      skipRepopulate.current = false;
      markSaved();
      setChanged(false);
      toaster.push(
        <Notification
          type="success"
          header={t('pageEditor.overview.pageDraftSaved')}
          duration={2000}
        />,
        { placement: 'bottomEnd' }
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
        { placement: 'bottomEnd' }
      );
    }
  }

  async function handleAutosave() {
    if (!pageID || !validateAll.current().ok) {
      return;
    }

    const version = changeVersion.current;
    const { data } = await autosavePage({
      variables: { id: pageID, ...createInput() },
    });

    if (!data) {
      return;
    }

    skipRepopulate.current = true;

    if (version === changeVersion.current) {
      setChanged(false);
    }

    toaster.push(
      <Notification
        type="success"
        header={t('pageEditor.overview.pageDraftAutosaved')}
        duration={2000}
      />,
      { placement: 'bottomEnd' }
    );
    await reloadRevisions();
  }

  const { markSaved } = useAutosave({
    enabled: !isDisabled && !!pageID,
    hasChanged,
    onAutosave: handleAutosave,
  });

  async function handlePublish(publishedAt: Date) {
    if (!runEditorValidation('publish')) {
      return;
    }
    if (pageID) {
      const { data } = await updatePage({
        variables: { id: pageID, ...createInput() },
      });

      if (data) {
        skipRepopulate.current = false;
        markSaved();
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
      { placement: 'bottomEnd' }
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
      <EditorTemplate
        maxWidth={showPreview ? '80vw' : undefined}
        navigationChildren={
          <EditorHeader
            state={stateColor}
            stateLabel={tagTitle}
            meta={<LastSavedAt date={pageData?.page?.latest.createdAt} />}
            back={
              <Link to="/pages">
                <RIconButton
                  circle
                  appearance="subtle"
                  icon={<MdKeyboardBackspace />}
                  title={t('back')}
                  aria-label={t('back')}
                  onClick={e => {
                    if (!unsavedChangesDialog()) e.preventDefault();
                  }}
                />
              </Link>
            }
            secondaryActions={
              <>
                <EditorHeaderButton
                  appearance="subtle"
                  icon={<MdIntegrationInstructions />}
                  label={t('pageEditor.overview.metadata')}
                  disabled={isDisabled}
                  onClick={() => setMetaDrawerOpen(true)}
                />

                {!isNew && (
                  <>
                    <PermissionControl qualifyingPermissions={['CAN_GET_PAGE']}>
                      <EditorHeaderButton
                        appearance="subtle"
                        icon={<MdHistory />}
                        label={t('versionHistory.title')}
                        disabled={isDisabled}
                        onClick={() => {
                          if (isVersionHistoryRequested) {
                            refetchRevisions();
                          }
                          setVersionHistoryRequested(true);
                          setVersionHistoryOpen(true);
                        }}
                      />
                    </PermissionControl>

                    {pageData?.page?.draft && pageData?.page?.published && (
                      <PermissionControl
                        qualifyingPermissions={['CAN_CREATE_PAGE']}
                      >
                        <EditorHeaderButton
                          appearance="subtle"
                          icon={<MdDeleteOutline />}
                          label={t('discardDraft.button')}
                          disabled={isDisabled}
                          onClick={() => setDiscardDialogOpen(true)}
                        />
                      </PermissionControl>
                    )}
                  </>
                )}

                <PermissionControl qualifyingPermissions={[CanPreview.id]}>
                  {showPreview && previewUrl && (
                    <PreviewControls
                      device={previewDevice}
                      onDeviceChange={setPreviewDevice}
                      previewUrl={previewUrl}
                    />
                  )}

                  <EditorHeaderButton
                    className="actionButton"
                    appearance={showPreview ? 'ghost' : 'subtle'}
                    icon={showPreview ? <MdEdit /> : <MdRemoveRedEye />}
                    label={
                      showPreview ?
                        t('preview.backToEditor')
                      : t('pageEditor.overview.preview')
                    }
                    disabled={isPreviewDisabled}
                    onClick={() => setPreviewOpen(!showPreview)}
                  />
                </PermissionControl>
              </>
            }
            primaryActions={
              isNew && createData == null ?
                <PermissionControl qualifyingPermissions={['CAN_CREATE_PAGE']}>
                  <EditorHeaderButton
                    appearance="primary"
                    icon={<MdSave />}
                    label={t('create')}
                    collapse={false}
                    disabled={isDisabled}
                    onClick={handleSave}
                  />
                </PermissionControl>
              : <PermissionControl qualifyingPermissions={['CAN_CREATE_PAGE']}>
                  <Badge className={hasChanged ? 'unsaved' : 'saved'}>
                    <EditorHeaderButton
                      icon={<MdSave />}
                      label={t('save')}
                      collapse="sm"
                      disabled={isDisabled}
                      onClick={handleSave}
                    />
                  </Badge>

                  <PermissionControl
                    qualifyingPermissions={['CAN_PUBLISH_PAGE']}
                  >
                    <Badge
                      className={
                        pageData?.page?.draft || !pageData?.page?.published ?
                          'unsaved'
                        : 'saved'
                      }
                    >
                      <EditorHeaderButton
                        appearance="primary"
                        icon={<MdCloudUpload />}
                        label={t('pageEditor.overview.publish')}
                        collapse={false}
                        disabled={isDisabled}
                        onClick={() => {
                          if (!runEditorValidation('publish')) {
                            return;
                          }
                          setPublishDialogOpen(true);
                        }}
                      />
                    </Badge>
                  </PermissionControl>
                </PermissionControl>
            }
          />
        }
      >
        {showPreview && previewUrl && (
          <PreviewFrame
            key={pageData?.page?.latest.id}
            previewUrl={previewUrl}
            device={previewDevice}
            title={t('pageEditor.overview.preview')}
            createToken={async () => {
              const { data: jwtData } = await createJWT();

              return jwtData?.createJWTForWebsiteLogin?.token;
            }}
            onSilence={() =>
              toaster.push(
                <Message
                  type="warning"
                  showIcon
                  closable
                >
                  {t('previewHandshake.notResponding')}
                </Message>
              )
            }
          />
        )}

        <EditorContent hidden={showPreview}>
          <EditorValidationProvider runAllRef={validateAll}>
            <TeaserOverviewWrapper>
              <TeaserOverviewPanel
                blocks={blocks}
                onChange={handleChange}
              />
            </TeaserOverviewWrapper>

            <DocumentUrlProvider documentUrl={pageData?.page?.url}>
              <BlockList
                value={blocks}
                onChange={handleChange}
                disabled={isBusy || !isAuthorized}
                blockMap={BlockMap}
              />
            </DocumentUrlProvider>
          </EditorValidationProvider>
        </EditorContent>
      </EditorTemplate>

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
            changeVersion.current++;
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
