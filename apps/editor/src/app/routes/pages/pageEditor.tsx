import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Badge,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Drawer,
  IconButton,
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
import {
  CanCreatePage,
  CanDeletePage,
  CanGetPage,
  CanGetPages,
  CanPreview,
  CanPublishPage,
} from '@wepublish/permissions';
import type { AggregatedValidation } from '@wepublish/ui/editor';
import {
  blockForQueryBlock,
  BlockList,
  BlockMap,
  BlockValue,
  createCheckedPermissionComponent,
  DocumentUrlProvider,
  DRAWER_WIDTHS,
  EditorHeader,
  EditorHeaderButton,
  EditorTemplate,
  EditorValidationProvider,
  getSeoBlockContext,
  enqueueSnackbar,
  mapBlockValueToBlockInput,
  PageMetadata,
  PageMetadataPanel,
  PermissionControl,
  PublishPagePanel,
  RevisionContentPreview,
  StateColor,
  TeaserOverviewPanel,
  useAuthorisation,
  useHasPermission,
  useUnsavedChangesDialog,
  VersionHistory,
  VersionHistoryRevision,
} from '@wepublish/ui/editor';
import {
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdCloudUpload,
  MdDeleteOutline,
  MdEdit,
  MdHistory,
  MdIntegrationInstructions,
  MdKeyboardBackspace,
  MdLink,
  MdRemoveRedEye,
  MdSave,
} from 'react-icons/md';
import {
  Link as RouterLink,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';

import { AutosaveToggle } from '../../autosaveToggle';
import { copyLinkToClipboard } from '../../copyLink';
import { LastSavedAt } from '../../lastSavedAt';
import {
  PreviewControls,
  PreviewDevice,
  PreviewFrame,
} from '../../previewFrame';
import { useAutosave } from '../../useAutosave';
import { useAutosaveEnabled } from '../../useAutosaveEnabled';
import { usePageTemplatePrefill } from '../pageTemplate/pageTemplatePrefill';
import { TemplateLoadingBackdrop } from '../templates/templateLoadingBackdrop';
import { emptyPageMetadata } from './pageDefaults';
import { pageMetadataToMetadataInput, pageToPageMetadata } from './pageMapping';

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
  const [searchParams] = useSearchParams();

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
  const [metadata, setMetadata] = useState<PageMetadata>(emptyPageMetadata);

  const isNew = id === undefined;
  const [hasChanged, setChanged] = useState(false);
  const [blocks, setBlocks] = useState<BlockValue[]>([]);

  const { loading: isLoadingTemplate } = usePageTemplatePrefill(
    isNew ? searchParams.get('templateId') : null,
    useCallback(({ blocks, metadata: templateMetadata }) => {
      setBlocks(blocks);
      setMetadata(meta => ({ ...meta, ...templateMetadata }));
      setChanged(true);
    }, [])
  );

  const seoContext = useMemo(
    () => (isMetaDrawerOpen ? getSeoBlockContext(blocks) : undefined),
    [blocks, isMetaDrawerOpen]
  );

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
    isLoadingTemplate ||
    isNotFound;
  // Autosaving must not disable the blocks, as that would blur whatever the user is typing in.
  const isDisabled = isBusy || isAutosaving;
  const canPreview = Boolean(
    pageData?.page?.draft ||
    pageData?.page?.published ||
    pageData?.page?.pending
  );

  const changeVersion = useRef(0);
  const skipRepopulate = useRef(false);
  const unsavedChangesDialog = useUnsavedChangesDialog(hasChanged);

  const previewUrl = pageData?.page?.previewUrl;
  const publishedUrl =
    pageData?.page?.published ? pageData.page.url : undefined;
  const isPreviewDisabled = hasChanged || !id || !canPreview || !previewUrl;
  const showPreview = isPreviewOpen && !isPreviewDisabled;

  const isAuthorized = useAuthorisation(CanCreatePage.id);

  const handleChange = useCallback((blocks: SetStateAction<BlockValue[]>) => {
    setBlocks(blocks);
    changeVersion.current++;
    setChanged(true);
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (pageData?.page && !hasChanged && !skipRepopulate.current) {
      const { latest } = pageData.page;

      if (latest.publishedAt) {
        setPublishedAt(new Date(latest.publishedAt));
      }

      setMetadata(pageToPageMetadata(pageData.page));
      setBlocks(latest.blocks.map(blockForQueryBlock));
    }
  }, [pageData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const { stateColor, tagTitle } = (() => {
    const pending = pageData?.page?.pending;

    if (pending) {
      return {
        stateColor: StateColor.pending,
        tagTitle: t('pageEditor.overview.pending', {
          date: new Date(pending.publishedAt ?? ''),
        }),
      };
    }

    const publishedAt = pageData?.page?.latest.publishedAt;

    if (publishedAt) {
      return {
        stateColor: StateColor.published,
        tagTitle: t('pageEditor.overview.published', {
          date: new Date(publishedAt),
        }),
      };
    }

    return {
      stateColor: StateColor.draft,
      tagTitle: t('pageEditor.overview.unpublished'),
    };
  })();

  useEffect(() => {
    const error =
      createError?.message ??
      updateError?.message ??
      autosaveError?.message ??
      publishError?.message ??
      restoreError?.message ??
      discardError?.message;
    if (error) {
      enqueueSnackbar(error, { variant: 'error', autoHideDuration: null });
    }
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

      enqueueSnackbar('', {
        variant: 'success',
        title: t('discardDraft.success'),
        autoHideDuration: 2000,
      });
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

        enqueueSnackbar('', {
          variant: 'success',
          title: t('versionHistory.restored'),
          autoHideDuration: 2000,
        });

        setVersionHistoryOpen(false);
      }
    } finally {
      setRestoringRevisionId(null);
    }
  }

  function createInput(): CreatePageMutationVariables {
    return {
      ...pageMetadataToMetadataInput(metadata),
      slug: metadata.slug ?? '',
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
    enqueueSnackbar(
      <>
        <strong>{header}</strong>
        <div>{summaries || t('pageEditor.validationFailedGeneric')}</div>
      </>,
      { variant: 'error', autoHideDuration: 8000 }
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
      enqueueSnackbar('', {
        variant: 'success',
        title: t('pageEditor.overview.pageDraftSaved'),
        autoHideDuration: 2000,
      });
      await Promise.all([refetch({ id: pageID }), reloadRevisions()]);
    } else {
      const { data } = await createPage({ variables: input });

      if (data) {
        navigate(`/pages/edit/${data?.createPage.id}`, { replace: true });
      }
      setChanged(false);
      enqueueSnackbar('', {
        variant: 'success',
        title: t('pageEditor.overview.pageDraftCreated'),
        autoHideDuration: 2000,
      });
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

    enqueueSnackbar('', {
      variant: 'success',
      title: t('pageEditor.overview.pageDraftAutosaved'),
      autoHideDuration: 2000,
    });
    await reloadRevisions();
  }

  const [autosaveEnabled] = useAutosaveEnabled();

  const { markSaved } = useAutosave({
    enabled: autosaveEnabled && !isDisabled && !!pageID,
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
    enqueueSnackbar('', {
      variant: 'success',
      title: t(
        publishedAt <= new Date() ?
          'pageEditor.overview.pagePublished'
        : 'pageEditor.overview.pagePending'
      ),
      autoHideDuration: 2000,
    });
  }

  useEffect(() => {
    if (isNotFound) {
      enqueueSnackbar(t('pageEditor.overview.pageNotFound'), {
        variant: 'error',
        autoHideDuration: null,
      });
    }
  }, [isNotFound, t]);

  const canSeeVersionHistory = useHasPermission([CanGetPage.id]);
  const canDiscardDraft = useHasPermission([CanCreatePage.id]);

  return (
    <>
      <EditorTemplate
        maxWidth={showPreview ? '80vw' : undefined}
        navigationChildren={
          <EditorHeader
            state={stateColor}
            stateLabel={tagTitle}
            meta={<LastSavedAt date={pageData?.page?.latest.createdAt} />}
            statusAction={<AutosaveToggle disabled={isDisabled || isNew} />}
            back={
              <IconButton
                component={RouterLink}
                to="/pages"
                title={t('back')}
                aria-label={t('back')}
                onClick={e => {
                  if (!unsavedChangesDialog()) {
                    e.preventDefault();
                  }
                }}
              >
                <MdKeyboardBackspace />
              </IconButton>
            }
            menuActions={[
              {
                label: t('pageEditor.overview.metadata'),
                icon: <MdIntegrationInstructions />,
                disabled: isDisabled,
                onClick: () => setMetaDrawerOpen(true),
              },
              ...(!isNew && canSeeVersionHistory ?
                [
                  {
                    label: t('versionHistory.title'),
                    icon: <MdHistory />,
                    disabled: isDisabled,
                    onClick: () => {
                      if (isVersionHistoryRequested) {
                        refetchRevisions();
                      }
                      setVersionHistoryRequested(true);
                      setVersionHistoryOpen(true);
                    },
                  },
                ]
              : []),
              ...(!isNew && publishedUrl ?
                [
                  {
                    label: t('copyLink.button'),
                    icon: <MdLink />,
                    onClick: () => copyLinkToClipboard(publishedUrl, t),
                  },
                ]
              : []),
              ...((
                !isNew &&
                canDiscardDraft &&
                !!pageData?.page?.draft &&
                !!pageData?.page?.published
              ) ?
                [
                  {
                    label: t('discardDraft.button'),
                    icon: <MdDeleteOutline />,
                    disabled: isDisabled,
                    onClick: () => setDiscardDialogOpen(true),
                  },
                ]
              : []),
            ]}
            secondaryActions={
              <>
                <PermissionControl qualifyingPermissions={[CanPreview.id]}>
                  {showPreview && previewUrl && (
                    <PreviewControls
                      device={previewDevice}
                      onDeviceChange={setPreviewDevice}
                      previewUrl={previewUrl}
                    />
                  )}

                  <EditorHeaderButton
                    variant="outlined"
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
                <PermissionControl qualifyingPermissions={[CanCreatePage.id]}>
                  <EditorHeaderButton
                    variant="contained"
                    icon={<MdSave />}
                    label={t('create')}
                    collapse={false}
                    disabled={isDisabled}
                    onClick={handleSave}
                  />
                </PermissionControl>
              : <PermissionControl qualifyingPermissions={[CanCreatePage.id]}>
                  <Badge
                    variant="dot"
                    color="warning"
                    invisible={!hasChanged}
                  >
                    <EditorHeaderButton
                      variant="outlined"
                      icon={<MdSave />}
                      label={t('save')}
                      collapse="sm"
                      disabled={isDisabled}
                      onClick={handleSave}
                    />
                  </Badge>

                  <PermissionControl
                    qualifyingPermissions={[CanPublishPage.id]}
                  >
                    <Badge
                      variant="dot"
                      color="warning"
                      invisible={
                        !pageData?.page?.draft && !!pageData?.page?.published
                      }
                    >
                      <EditorHeaderButton
                        variant="contained"
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
              enqueueSnackbar(t('previewHandshake.notResponding'), {
                variant: 'warning',
              })
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

      <TemplateLoadingBackdrop
        open={isLoadingTemplate}
        label={t('pageEditor.overview.loadingTemplate')}
      />

      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              width: DRAWER_WIDTHS.sm,
              maxWidth: '100vw',
            },
          },
        }}
        open={isMetaDrawerOpen}
        onClose={() => setMetaDrawerOpen(false)}
      >
        <PageMetadataPanel
          seoContext={seoContext}
          value={metadata}
          onSave={() => handleSave()}
          onClose={() => {
            handleSave();
            setMetaDrawerOpen(false);
          }}
          onChange={value => {
            setMetadata(value);
            changeVersion.current++;
            setChanged(true);
          }}
          onCreateTemplate={
            pageID ?
              () => {
                if (unsavedChangesDialog()) {
                  navigate(
                    `/pages/templates/create?fromPage=${encodeURIComponent(pageID)}`
                  );
                }
              }
            : undefined
          }
        />
      </Drawer>

      <Dialog
        fullWidth
        open={isPublishDialogOpen}
        maxWidth="sm"
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
      </Dialog>

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

      <Dialog
        open={isDiscardDialogOpen}
        onClose={() => setDiscardDialogOpen(false)}
      >
        <DialogTitle>{t('discardDraft.confirm.title')}</DialogTitle>

        <DialogContent>
          <DialogContentText>
            {t('discardDraft.confirm.message')}
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDiscardDialogOpen(false)}>
            {t('discardDraft.confirm.cancel')}
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={() => {
              setDiscardDialogOpen(false);
              handleDiscardDraft();
            }}
          >
            {t('discardDraft.confirm.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
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
export { CheckedPermissionComponent as PageEditor };
