import styled from '@emotion/styled';
import { useCreateJwtForWebsiteLoginLazyQuery } from '@wepublish/editor/api';
import {
  CreateArticleMutationVariables,
  EditorBlockType,
  FullAuthorFragment,
  FullImageFragment,
  getApiClientV2,
  SettingName,
  useArticleQuery,
  useCreateArticleMutation,
  usePublishArticleMutation,
  useSettingsListQuery,
  useUpdateArticleMutation,
} from '@wepublish/editor/api-v2';
import { CanPreview } from '@wepublish/permissions';
import {
  ArticleMetadata,
  ArticleMetadataPanel,
  blockForQueryBlock,
  BlockList,
  BlockMap,
  BlockValue,
  createCheckedPermissionComponent,
  EditorTemplate,
  InfoData,
  ListicleBlockListValue,
  mapBlockValueToBlockInput,
  NavigationBar,
  PermissionControl,
  PublishArticlePanel,
  QuoteBlockListValue,
  RichTextBlockListValue,
  StateColor,
  TitleBlockListValue,
  TitleBlockValue,
  useAuthorisation,
  useUnsavedChangesDialog,
} from '@wepublish/ui/editor';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdCloudUpload,
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
import { type Node, Descendant, Element, Text } from 'slate';

const IconButtonMarginTop = styled(RIconButton)`
  margin-top: 4px;
`;

const IconButton = styled(RIconButton)`
  margin-left: 10px;
`;

const CenterChildren = styled.div`
  margin-top: 4px;
  margin-bottom: 20px;
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

const InitialArticleBlocks: BlockValue[] = [
  {
    key: '0',
    type: EditorBlockType.Title,
    value: { preTitle: '', title: '', lead: '' },
  },
  {
    key: '1',
    type: EditorBlockType.Image,
    value: { image: null, caption: '' },
  },
];

function countRichtextChars(blocksCharLength: number, nodes: Node[]): number {
  return nodes.reduce((charLength: number, node) => {
    if (!Element.isElement(node) && !Text.isText(node)) {
      return charLength;
    }

    if (Text.isText(node)) {
      return charLength + (node.text as string).length;
    }

    return countRichtextChars(charLength, node.children as Descendant[]);
  }, blocksCharLength);
}

function ArticleEditor() {
  const navigate = useNavigate();
  const params = useParams();
  const { id } = params;

  const { t } = useTranslation();

  const client = getApiClientV2();
  const [
    createArticle,
    { data: createData, loading: isCreating, error: createError },
  ] = useCreateArticleMutation({ client });
  const [updateArticle, { loading: isUpdating, error: updateError }] =
    useUpdateArticleMutation({
      client,
    });
  const [publishArticle, { loading: isPublishing, error: publishError }] =
    usePublishArticleMutation({
      client,
    });

  const [isMetaDrawerOpen, setMetaDrawerOpen] = useState(false);
  const [isPublishDialogOpen, setPublishDialogOpen] = useState(false);

  const [publishedAt, setPublishedAt] = useState<Date>();

  const [metadata, setMetadata] = useState<ArticleMetadata>({
    slug: '',
    preTitle: '',
    title: '',
    lead: '',
    seoTitle: '',
    authors: [],
    tags: [],
    defaultTags: [],
    url: '',
    properties: [],
    canonicalUrl: '',
    shared: undefined,
    paywall: undefined,
    hidden: false,
    disableComments: false,
    breaking: false,
    image: undefined,
    hideAuthor: false,
    socialMediaTitle: undefined,
    socialMediaDescription: undefined,
    socialMediaAuthors: [],
    socialMediaImage: undefined,
    likes: 0,
    trackingPixels: undefined,
  });

  useSettingsListQuery({
    client,
    onCompleted(data) {
      setMetadata(meta => ({
        ...meta,
        shared:
          meta.shared ??
          !!data.settings.find(
            setting => setting.name === SettingName.NewArticlePeering
          )?.value,
        paywall:
          meta.paywall ??
          data.settings.find(
            setting => setting.name === SettingName.NewArticlePaywall
          )?.value,
      }));
    },
  });

  const isNew = id === undefined;
  const [blocks, setBlocks] = useState<BlockValue[]>(
    isNew ? InitialArticleBlocks : []
  );

  const articleID = id || createData?.createArticle.id;

  const {
    data: articleData,
    refetch,
    loading: isLoading,
  } = useArticleQuery({
    client,
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
    variables: { id: articleID! },
    skip: !articleID,
  });

  const [createJWT] = useCreateJwtForWebsiteLoginLazyQuery({
    errorPolicy: 'none',
  });

  const isNotFound = articleData && !articleData.article;
  const isDisabled =
    isLoading || isCreating || isUpdating || isPublishing || isNotFound;
  const canPreview = Boolean(articleData?.article?.draft);

  const [hasChanged, setChanged] = useState(false);

  const unsavedChangesDialog = useUnsavedChangesDialog(hasChanged);

  const isAuthorized = useAuthorisation('CAN_CREATE_ARTICLE');

  const handleChange = useCallback(
    (blocks: React.SetStateAction<BlockValue[]>) => {
      setBlocks(blocks);
      setChanged(true);
    },
    []
  );

  useEffect(() => {
    if (articleData?.article) {
      const {
        latest,
        shared,
        hidden,
        disableComments,
        tags,
        url,
        slug,
        trackingPixels,
        likes,
        paywallId,
      } = articleData.article;
      const {
        preTitle,
        title,
        seoTitle,
        lead,
        breaking,
        authors,
        image,
        blocks,
        properties,
        hideAuthor,
        canonicalUrl,
        socialMediaTitle,
        socialMediaDescription,
        socialMediaAuthors,
        socialMediaImage,
      } = latest;

      if (latest.publishedAt) {
        setPublishedAt(new Date(latest.publishedAt));
      }

      setMetadata({
        slug,
        preTitle: preTitle ?? '',
        title: title ?? '',
        lead: lead ?? '',
        seoTitle: seoTitle ?? '',
        tags: tags.map(({ id }) => id),
        defaultTags: tags,
        url,
        properties,
        canonicalUrl: canonicalUrl ?? '',
        shared,
        paywall: paywallId,
        hidden,
        disableComments,
        breaking,
        authors: authors.filter(
          author => author != null
        ) as FullAuthorFragment[],
        image: (image as FullImageFragment) || undefined,
        hideAuthor,
        socialMediaTitle: socialMediaTitle || '',
        socialMediaDescription: socialMediaDescription || '',
        socialMediaAuthors: socialMediaAuthors?.filter(
          socialMediaAuthor => socialMediaAuthor != null
        ) as FullAuthorFragment[],
        socialMediaImage: (socialMediaImage as FullImageFragment) || undefined,
        likes: likes ?? 0,
        trackingPixels: trackingPixels || undefined,
      });

      setBlocks(blocks.map(blockForQueryBlock));
    }
  }, [articleData]);

  const [stateColor, setStateColor] = useState<StateColor>(StateColor.none);
  const [tagTitle, setTagTitle] = useState<string>('');

  useEffect(() => {
    if (articleData?.article?.pending) {
      setStateColor(StateColor.pending);
      setTagTitle(
        t('articleEditor.overview.pending', {
          date: new Date(articleData?.article?.pending?.publishedAt ?? ''),
        })
      );
    } else if (articleData?.article?.latest.publishedAt) {
      setStateColor(StateColor.published);
      setTagTitle(
        t('articleEditor.overview.published', {
          date: new Date(articleData?.article?.latest?.publishedAt ?? ''),
        })
      );
    } else {
      setStateColor(StateColor.draft);
      setTagTitle(t('articleEditor.overview.unpublished'));
    }
  }, [articleData, hasChanged, t]);

  useEffect(() => {
    const error =
      createError?.message ?? updateError?.message ?? publishError?.message;
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
  }, [createError, updateError, publishError]);

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
      slug: metadata.slug,
      preTitle: metadata.preTitle || undefined,
      title: metadata.title,
      lead: metadata.lead,
      seoTitle: metadata.seoTitle,
      authorIds: metadata.authors.map(({ id }) => id),
      imageID: metadata.image?.id,
      breaking: metadata.breaking,
      shared: !!metadata.shared,
      paywallId: metadata.paywall,
      hidden: metadata.hidden ?? false,
      disableComments: metadata.disableComments ?? false,
      tagIds: metadata.tags,
      canonicalUrl: metadata.canonicalUrl,
      properties: metadata.properties,
      blocks: blocks.map(mapBlockValueToBlockInput),
      hideAuthor: metadata.hideAuthor,
      socialMediaTitle: metadata.socialMediaTitle || undefined,
      socialMediaDescription: metadata.socialMediaDescription || undefined,
      socialMediaAuthorIds: metadata.socialMediaAuthors.map(({ id }) => id),
      socialMediaImageID: metadata.socialMediaImage?.id || undefined,
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

  async function handleSave() {
    const input = createInput();

    if (articleID) {
      await updateArticle({ variables: { id: articleID, ...input } });

      setChanged(false);
      toaster.push(
        <Notification
          type="success"
          header={t('articleEditor.overview.draftSaved')}
          duration={2000}
        />,
        { placement: 'topEnd' }
      );
      await refetch({ id: articleID });
    } else {
      const { data } = await createArticle({ variables: input });
      if (data) {
        navigate(`/articles/edit/${data?.createArticle.id}`, { replace: true });
      }
      setChanged(false);
      toaster.push(
        <Notification
          type="success"
          header={t('articleEditor.overview.draftCreated')}
          duration={2000}
        />,
        { placement: 'topEnd' }
      );
    }
  }

  async function handlePublish(publishedAt: Date) {
    if (!metadata.slug) {
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={0}
        >
          {t('articleEditor.overview.noSlug')}
        </Message>
      );
      return;
    }

    if (articleID) {
      const { data } = await updateArticle({
        variables: { id: articleID, ...createInput() },
      });

      if (data) {
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

      toaster.push(
        <Notification
          type="success"
          header={t(
            publishedAt <= new Date() ?
              'articleEditor.overview.articlePublished'
            : 'articleEditor.overview.articlePending'
          )}
          duration={2000}
        />,
        { placement: 'topEnd' }
      );
    }
    await refetch({ id: articleID });
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
          {t('articleEditor.overview.notFound')}
        </Message>
      );
    }
  }, [isNotFound, t]);

  const [infoData, setInfoData] = useState<InfoData>({
    charCount: 0,
  });

  useEffect(() => {
    setInfoData({
      charCount: wordCounter(blocks),
    });
  }, [isMetaDrawerOpen]);

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
                <Link to="/articles">
                  <RIconButton
                    size="lg"
                    className="actionButton"
                    icon={<MdKeyboardBackspace />}
                    onClick={e => {
                      if (!unsavedChangesDialog()) e.preventDefault();
                    }}
                  >
                    {t('articleEditor.overview.back')}
                  </RIconButton>
                </Link>
              }
              centerChildren={
                <CenterChildren>
                  <RIconButton
                    icon={<MdIntegrationInstructions />}
                    size="lg"
                    disabled={isDisabled}
                    className="actionButton"
                    onClick={() => {
                      syncFirstTitleBlockWithMetadata();
                      setMetaDrawerOpen(true);
                    }}
                  >
                    {t('articleEditor.overview.metadata')}
                  </RIconButton>

                  {isNew && createData == null ?
                    <PermissionControl
                      qualifyingPermissions={['CAN_CREATE_ARTICLE']}
                    >
                      <IconButton
                        className="actionButton"
                        size="lg"
                        icon={<MdSave />}
                        disabled={isDisabled}
                        onClick={() => handleSave()}
                      >
                        {t('create')}
                      </IconButton>
                    </PermissionControl>
                  : <PermissionControl
                      qualifyingPermissions={['CAN_CREATE_ARTICLE']}
                    >
                      <Badge className={hasChanged ? 'unsaved' : 'saved'}>
                        <IconButton
                          className="actionButton"
                          size="lg"
                          icon={<MdSave />}
                          disabled={isDisabled}
                          onClick={() => handleSave()}
                        >
                          {t('save')}
                        </IconButton>
                      </Badge>
                      <PermissionControl
                        qualifyingPermissions={['CAN_PUBLISH_ARTICLE']}
                      >
                        <Badge
                          className={
                            (
                              articleData?.article?.draft ||
                              !articleData?.article?.published
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
                              setPublishDialogOpen(true);
                            }}
                          >
                            {t('articleEditor.overview.publish')}
                          </IconButton>
                        </Badge>
                      </PermissionControl>
                    </PermissionControl>
                  }
                </CenterChildren>
              }
              rightChildren={
                <PermissionControl qualifyingPermissions={[CanPreview.id]}>
                  <IconButtonMarginTop
                    disabled={hasChanged || !id || !canPreview}
                    size="lg"
                    icon={<MdRemoveRedEye />}
                    // open via button not link as it contains a JWT
                    onClick={async () => {
                      const { data: jwt } = await createJWT();

                      window.open(
                        `${articleData!.article.previewUrl}&jwt=${
                          jwt?.createJWTForWebsiteLogin?.token
                        }`,
                        '_blank'
                      );
                    }}
                  >
                    {t('articleEditor.overview.preview')}
                  </IconButtonMarginTop>
                </PermissionControl>
              }
            />
          }
        >
          <BlockList
            itemId={articleID}
            value={blocks}
            onChange={handleChange}
            disabled={isLoading || isDisabled || !isAuthorized}
            blockMap={BlockMap}
          />
        </EditorTemplate>
      </FieldSet>

      <Drawer
        open={isMetaDrawerOpen}
        size="md"
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
            setChanged(true);
          }}
        />
      </Drawer>

      <Modal
        open={isPublishDialogOpen}
        size="sm"
        onClose={() => setPublishDialogOpen(false)}
      >
        <PublishArticlePanel
          publishedAtDate={publishedAt}
          metadata={metadata}
          onClose={() => setPublishDialogOpen(false)}
          onConfirm={publishedAt => {
            handlePublish(publishedAt);
            setPublishDialogOpen(false);
          }}
        />
      </Modal>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_ARTICLE',
  'CAN_GET_ARTICLES',
  'CAN_CREATE_ARTICLE',
  'CAN_DELETE_ARTICLE',
])(ArticleEditor);
export { CheckedPermissionComponent as ArticleEditor };
