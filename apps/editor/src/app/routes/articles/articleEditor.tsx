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
  ArticleDocument,
  ArticleRevisionListDocument,
  ArticleRevisionPreviewDocument,
  CreateArticleDocument,
  CreateArticleMutationVariables,
  CreateJwtForWebsiteLoginDocument,
  DiscardArticleDraftDocument,
  EditorBlockType,
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
import { RichtextElements, RichtextJSONDocument } from '@wepublish/richtext';
import type { AggregatedValidation } from '@wepublish/ui/editor';
import {
  ArticleMetadata,
  ArticleMetadataPanel,
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
  enqueueSnackbar,
  InfoData,
  ListicleBlockListValue,
  mapBlockValueToBlockInput,
  PermissionControl,
  PublishArticlePanel,
  QuoteBlockListValue,
  RevisionContentPreview,
  RichTextBlockListValue,
  StateColor,
  TitleBlockListValue,
  TitleBlockValue,
  useAuthorisation,
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

import { copyLinkToClipboard } from '../../copyLink';
import { AutosaveToggle } from '../../autosaveToggle';
import { LastSavedAt } from '../../lastSavedAt';
import {
  PreviewControls,
  PreviewDevice,
  PreviewFrame,
} from '../../previewFrame';
import { useAutosave } from '../../useAutosave';
import { emptyArticleMetadata, InitialArticleBlocks } from './articleDefaults';
import {
  articleMetadataToMetadataInput,
  articleToArticleMetadata,
} from './articleMapping';
import { useAutosaveEnabled } from '../../useAutosaveEnabled';
import { useArticleTemplatePrefill } from '../articleTemplate/articleTemplatePrefill';
import { TemplateLoadingBackdrop } from '../templates/templateLoadingBackdrop';
import { useNewArticleDefaults } from './useNewArticleDefaults';

const EditorContent = styled.div`
  width: 100%;

  &[hidden] {
    display: none;
  }
`;

const REVISIONS_PAGE_SIZE = 20;

function countRichtextChars(
  blocksCharLength: number,
  richtext?: RichtextJSONDocument | RichtextElements | null
): number {
  return (
    richtext?.content?.reduce((charLength: number, node: RichtextElements) => {
      if (node.type === 'text') {
        return charLength + node.text.length;
      }

      return countRichtextChars(charLength, node);
    }, blocksCharLength) ?? blocksCharLength
  );
}

function ArticleEditor() {
  const navigate = useNavigate();
  const params = useParams();
  const { id } = params;
  const [searchParams] = useSearchParams();

  const { t } = useTranslation();

  const [
    createArticle,
    { data: createData, loading: isCreating, error: createError },
  ] = useMutation(CreateArticleDocument);
  const [updateArticle, { loading: isUpdating, error: updateError }] =
    useMutation(UpdateArticleDocument, {});
  const [autosaveArticle, { loading: isAutosaving, error: autosaveError }] =
    useMutation(UpdateArticleDocument, {});
  const [publishArticle, { loading: isPublishing, error: publishError }] =
    useMutation(PublishArticleDocument, {});
  const [
    restoreArticleRevision,
    { loading: isRestoring, error: restoreError },
  ] = useMutation(RestoreArticleRevisionDocument, {});
  const [discardArticleDraft, { loading: isDiscarding, error: discardError }] =
    useMutation(DiscardArticleDraftDocument, {});

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

  const [metadata, setMetadata] =
    useState<ArticleMetadata>(emptyArticleMetadata);

  useNewArticleDefaults(setMetadata);

  const isNew = id === undefined;
  const [hasChanged, setChanged] = useState(false);
  const [blocks, setBlocks] = useState<BlockValue[]>(
    isNew ? InitialArticleBlocks : []
  );

  const { loading: isLoadingTemplate } = useArticleTemplatePrefill(
    isNew ? searchParams.get('templateId') : null,
    useCallback(({ blocks, metadata: templateMetadata }) => {
      setBlocks(blocks);
      setMetadata(meta => ({
        ...meta,
        ...templateMetadata,
        paywall: templateMetadata.paywall ?? meta.paywall,
      }));
      setChanged(true);
    }, [])
  );

  const articleID = id || createData?.createArticle.id;

  const {
    data: articleData,
    refetch,
    loading: isLoading,
  } = useQuery(ArticleDocument, {
    errorPolicy: 'all',
    variables: { id: articleID! },
    skip: !articleID,
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
  } = useQuery(ArticleRevisionListDocument, {
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    variables: { id: articleID!, take: REVISIONS_PAGE_SIZE, skip: 0 },
    skip: !articleID || !isVersionHistoryRequested,
  });

  const revisionNodes = revisionsData?.articleRevisions?.nodes ?? [];

  const revisions: VersionHistoryRevision[] = revisionNodes.map(revision => ({
    id: revision.id,
    createdAt: revision.createdAt,
    publishedAt: revision.publishedAt,
    archivedAt: revision.archivedAt,
    title: revision.title,
    subtitle: revision.preTitle || revision.lead,
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
          if (!fetchMoreResult?.articleRevisions) {
            return prev;
          }

          return {
            ...prev,
            articleRevisions: {
              ...fetchMoreResult.articleRevisions,
              nodes: [
                ...(prev.articleRevisions?.nodes ?? []),
                ...fetchMoreResult.articleRevisions.nodes,
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
  ] = useLazyQuery(ArticleRevisionPreviewDocument, { errorPolicy: 'all' });

  function handlePreviewRevision(revisionId: string) {
    setPreviewRevisionId(revisionId);
    loadRevisionPreview({ variables: { id: revisionId } });
  }

  const previewRevision =
    previewData?.articleRevision?.id === previewRevisionId ?
      previewData?.articleRevision
    : undefined;

  const isNotFound = articleData && !articleData.article;
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
    articleData?.article?.draft ||
      articleData?.article?.published ||
      articleData?.article?.pending
  );

  const changeVersion = useRef(0);
  const skipRepopulate = useRef(false);

  const unsavedChangesDialog = useUnsavedChangesDialog(hasChanged);

  const previewUrl = articleData?.article?.previewUrl;
  const publishedUrl =
    articleData?.article?.published ? articleData.article.url : undefined;
  const isPreviewDisabled = hasChanged || !id || !canPreview || !previewUrl;
  const showPreview = isPreviewOpen && !isPreviewDisabled;

  const isAuthorized = useAuthorisation(CanCreateArticle.id);

  const handleChange = useCallback((blocks: SetStateAction<BlockValue[]>) => {
    setBlocks(blocks);
    changeVersion.current++;
    setChanged(true);
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (articleData?.article && !hasChanged && !skipRepopulate.current) {
      const { latest } = articleData.article;

      if (latest.publishedAt) {
        setPublishedAt(new Date(latest.publishedAt));
      }

      setMetadata(articleToArticleMetadata(articleData.article));
      setBlocks(latest.blocks.map(blockForQueryBlock));
    }
  }, [articleData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const { stateColor, tagTitle } = (() => {
    const pending = articleData?.article?.pending;

    if (pending) {
      return {
        stateColor: StateColor.pending,
        tagTitle: t('articleEditor.overview.pending', {
          date: new Date(pending.publishedAt ?? ''),
        }),
      };
    }

    const publishedAt = articleData?.article?.latest.publishedAt;

    if (publishedAt) {
      return {
        stateColor: StateColor.published,
        tagTitle: t('articleEditor.overview.published', {
          date: new Date(publishedAt),
        }),
      };
    }

    return {
      stateColor: StateColor.draft,
      tagTitle: t('articleEditor.overview.unpublished'),
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
    if (!articleID) {
      return;
    }

    const { data } = await discardArticleDraft({
      variables: { id: articleID },
    });

    if (data) {
      skipRepopulate.current = false;
      markSaved();
      setChanged(false);
      await Promise.all([refetch({ id: articleID }), reloadRevisions()]);

      enqueueSnackbar('', {
        variant: 'success',
        title: t('discardDraft.success'),
        autoHideDuration: 2000,
      });
    }
  }

  async function handleRestoreRevision(revisionId: string) {
    if (!articleID) {
      return;
    }

    setRestoringRevisionId(revisionId);

    try {
      const { data } = await restoreArticleRevision({
        variables: { id: articleID, revisionId },
      });

      if (data) {
        // Let the article query repopulate the editor with the restored draft.
        skipRepopulate.current = false;
        markSaved();
        setChanged(false);
        await Promise.all([refetch({ id: articleID }), reloadRevisions()]);

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

  function countRichTextBlocksChars(block: RichTextBlockListValue) {
    return countRichtextChars(0, block.value.richText);
  }

  function countTitleChars(block: TitleBlockListValue): number {
    return block.value.title.length + block.value.lead.length;
  }

  function countQuoteChars(block: QuoteBlockListValue) {
    return block.value.quote.length + block.value.author.length;
  }

  function countListicleChars(block: ListicleBlockListValue) {
    const titleArray = block.value.items.map(item => {
      return item.value.title?.length ?? 0;
    });

    const totalTitleChars = titleArray.reduce(function (charCount: number, b) {
      return charCount + b;
    }, 0);

    const richTextBlocks = block.value.items.map(item => item.value.richText);

    const richTextBlocksCount = richTextBlocks.reduce(
      (charCount: number, item) => charCount + countRichtextChars(0, item),
      0
    );

    return totalTitleChars + richTextBlocksCount;
  }

  function wordCounter(blocks: BlockValue[]): number {
    return blocks.reduce((charLength: number, block: BlockValue) => {
      switch (block.type) {
        case EditorBlockType.Listicle:
          return charLength + countListicleChars(block);
        case EditorBlockType.Title:
          return charLength + countTitleChars(block);
        case EditorBlockType.Quote:
          return charLength + countQuoteChars(block);
        case EditorBlockType.RichText:
          return charLength + countRichTextBlocksChars(block);
        default:
          return charLength;
      }
    }, 0);
  }

  function createInput(): CreateArticleMutationVariables {
    return {
      ...articleMetadataToMetadataInput(metadata),
      slug: metadata.slug,
      canonicalUrl: metadata.canonicalUrl,
      blocks: blocks.map(mapBlockValueToBlockInput),
      likes: metadata.likes ?? 0,
    };
  }

  // Reads title and lead from the first block and saves them in variables
  function syncFirstTitleBlockWithMetadata() {
    if (
      metadata.title === '' &&
      metadata.lead === '' &&
      metadata.seoTitle === '' &&
      metadata.preTitle === '' &&
      blocks.length > 0
    ) {
      const titleBlock = blocks.find(
        block => block.type === EditorBlockType.Title
      );

      if (titleBlock?.value) {
        const titleBlockValue = titleBlock.value as TitleBlockValue;
        setMetadata({
          ...metadata,
          preTitle: titleBlockValue.preTitle,
          title: titleBlockValue.title,
          lead: titleBlockValue.lead,
          seoTitle: titleBlockValue.title,
        });
      }
    }
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
        t('articleEditor.publishValidationFailed')
      : t('articleEditor.saveValidationFailed');
    enqueueSnackbar(
      <>
        <strong>{header}</strong>
        <div>{summaries || t('articleEditor.validationFailedGeneric')}</div>
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

    if (articleID) {
      await updateArticle({ variables: { id: articleID, ...input } });

      skipRepopulate.current = false;
      markSaved();
      setChanged(false);
      enqueueSnackbar('', {
        variant: 'success',
        title: t('articleEditor.overview.draftSaved'),
        autoHideDuration: 2000,
      });
      await Promise.all([refetch({ id: articleID }), reloadRevisions()]);
    } else {
      const { data } = await createArticle({ variables: input });
      if (data) {
        navigate(`/articles/edit/${data?.createArticle.id}`, { replace: true });
      }
      setChanged(false);
      enqueueSnackbar('', {
        variant: 'success',
        title: t('articleEditor.overview.draftCreated'),
        autoHideDuration: 2000,
      });
    }
  }

  async function handleAutosave() {
    if (!articleID) {
      return;
    }

    const version = changeVersion.current;
    const { data } = await autosaveArticle({
      variables: { id: articleID, ...createInput() },
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
      title: t('articleEditor.overview.draftAutosaved'),
      autoHideDuration: 2000,
    });
    await reloadRevisions();
  }

  const [autosaveEnabled] = useAutosaveEnabled();

  const { markSaved } = useAutosave({
    enabled: autosaveEnabled && !isDisabled && !!articleID,
    hasChanged,
    onAutosave: handleAutosave,
  });

  async function handlePublish(publishedAt: Date) {
    if (!runEditorValidation('publish')) {
      return;
    }
    if (!metadata.slug) {
      enqueueSnackbar(t('articleEditor.overview.noSlug'), {
        variant: 'error',
        autoHideDuration: null,
      });
      return;
    }

    if (articleID) {
      const { data } = await updateArticle({
        variables: { id: articleID, ...createInput() },
      });

      if (data) {
        skipRepopulate.current = false;
        markSaved();
        const { data: publishData } = await publishArticle({
          variables: {
            id: articleID,
            publishedAt: publishedAt.toISOString(),
          },
        });

        if (publishData?.publishArticle?.latest?.publishedAt) {
          setPublishedAt(
            new Date(publishData?.publishArticle?.latest.publishedAt)
          );
        }
      }

      setChanged(false);

      enqueueSnackbar('', {
        variant: 'success',
        title: t(
          publishedAt <= new Date() ?
            'articleEditor.overview.articlePublished'
          : 'articleEditor.overview.articlePending'
        ),
        autoHideDuration: 2000,
      });
    }
    await Promise.all([refetch({ id: articleID }), reloadRevisions()]);
  }

  useEffect(() => {
    if (isNotFound) {
      enqueueSnackbar(t('articleEditor.overview.notFound'), {
        variant: 'error',
        autoHideDuration: null,
      });
    }
  }, [isNotFound, t]);

  const infoData = useMemo<InfoData>(
    () => ({ charCount: isMetaDrawerOpen ? wordCounter(blocks) : 0 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isMetaDrawerOpen]
  );

  return (
    <>
      <EditorTemplate
        maxWidth={showPreview ? '80vw' : undefined}
        navigationChildren={
          <EditorHeader
            state={stateColor}
            stateLabel={tagTitle}
            meta={<LastSavedAt date={articleData?.article?.latest.createdAt} />}
            statusAction={<AutosaveToggle disabled={isDisabled || isNew} />}
            back={
              <IconButton
                component={RouterLink}
                to="/articles"
                title={t('articleEditor.overview.back')}
                aria-label={t('articleEditor.overview.back')}
                onClick={e => {
                  if (!unsavedChangesDialog()) {
                    e.preventDefault();
                  }
                }}
              >
                <MdKeyboardBackspace />
              </IconButton>
            }
            secondaryActions={
              <>
                <EditorHeaderButton
                  variant="text"
                  icon={<MdIntegrationInstructions />}
                  label={t('articleEditor.overview.metadata')}
                  disabled={isDisabled}
                  onClick={() => {
                    syncFirstTitleBlockWithMetadata();
                    setMetaDrawerOpen(true);
                  }}
                />

                {!isNew && (
                  <>
                    <PermissionControl
                      qualifyingPermissions={[CanGetArticle.id]}
                    >
                      <EditorHeaderButton
                        variant="text"
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

                    {publishedUrl && (
                      <EditorHeaderButton
                        variant="text"
                        icon={<MdLink />}
                        label={t('copyLink.button')}
                        onClick={() => copyLinkToClipboard(publishedUrl, t)}
                      />
                    )}

                    {articleData?.article?.draft &&
                      articleData?.article?.published && (
                        <PermissionControl
                          qualifyingPermissions={[CanCreateArticle.id]}
                        >
                          <EditorHeaderButton
                            variant="text"
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
                    variant="outlined"
                    icon={showPreview ? <MdEdit /> : <MdRemoveRedEye />}
                    label={
                      showPreview ?
                        t('preview.backToEditor')
                      : t('articleEditor.overview.preview')
                    }
                    disabled={isPreviewDisabled}
                    onClick={() => setPreviewOpen(!showPreview)}
                  />
                </PermissionControl>
              </>
            }
            primaryActions={
              isNew && createData == null ?
                <PermissionControl
                  qualifyingPermissions={[CanCreateArticle.id]}
                >
                  <EditorHeaderButton
                    variant="contained"
                    icon={<MdSave />}
                    label={t('create')}
                    collapse={false}
                    disabled={isDisabled}
                    onClick={() => handleSave()}
                  />
                </PermissionControl>
              : <PermissionControl
                  qualifyingPermissions={[CanCreateArticle.id]}
                >
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
                      onClick={() => handleSave()}
                    />
                  </Badge>

                  <PermissionControl
                    qualifyingPermissions={[CanPublishArticle.id]}
                  >
                    <Badge
                      variant="dot"
                      color="warning"
                      invisible={
                        !articleData?.article?.draft &&
                        !!articleData?.article?.published
                      }
                    >
                      <EditorHeaderButton
                        variant="contained"
                        icon={<MdCloudUpload />}
                        label={t('articleEditor.overview.publish')}
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
            key={articleData?.article?.latest.id}
            previewUrl={previewUrl}
            device={previewDevice}
            title={t('articleEditor.overview.preview')}
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
            <DocumentUrlProvider documentUrl={articleData?.article?.url}>
              <BlockList
                itemId={articleID}
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
        label={t('articleEditor.overview.loadingTemplate')}
      />

      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              width: DRAWER_WIDTHS.md,
              maxWidth: '100vw',
            },
          },
        }}
        open={isMetaDrawerOpen}
        onClose={() => setMetaDrawerOpen(false)}
      >
        <ArticleMetadataPanel
          peerId={articleData?.article.peer?.id}
          articleID={articleID}
          value={metadata}
          infoData={infoData}
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
            articleID ?
              () => {
                if (unsavedChangesDialog()) {
                  navigate(
                    `/articles/templates/create?fromArticle=${encodeURIComponent(articleID)}`
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
        <PublishArticlePanel
          publishedAtDate={publishedAt}
          firstPublishedAtDate={
            articleData?.article?.publishedAt ?
              new Date(articleData.article.publishedAt)
            : undefined
          }
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
        totalCount={revisionsData?.articleRevisions?.totalCount}
        hasMore={!!revisionsData?.articleRevisions?.pageInfo?.hasNextPage}
        loadingMore={isLoadingMoreRevisions}
        onLoadMore={loadMoreRevisions}
        draftId={articleData?.article?.draft?.id}
        pendingId={articleData?.article?.pending?.id}
        publishedId={articleData?.article?.published?.id}
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
        subtitle={previewRevision?.preTitle || previewRevision?.lead}
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
  CanGetArticle.id,
  CanGetArticles.id,
  CanCreateArticle.id,
  CanDeleteArticle.id,
])(ArticleEditor);
export { CheckedPermissionComponent as ArticleEditor };
