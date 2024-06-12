import styled from '@emotion/styled'
import {
  ArticleInput,
  AuthorRefFragment,
  useArticlePreviewLinkLazyQuery,
  useArticleQuery,
  useCreateArticleMutation,
  usePublishArticleMutation,
  useUpdateArticleMutation
} from '@wepublish/editor/api'
import {BlockType} from '@wepublish/editor/api-v2'
import {
  ArticleMetadata,
  ArticleMetadataPanel,
  blockForQueryBlock,
  BlockList,
  BlockMap,
  BlockValue,
  createCheckedPermissionComponent,
  EditorTemplate,
  getSettings,
  InfoData,
  ListicleBlockListValue,
  NavigationBar,
  PermissionControl,
  PublishArticlePanel,
  QuoteBlockListValue,
  RichTextBlockListValue,
  StateColor,
  TitleBlockListValue,
  TitleBlockValue,
  unionMapForBlock,
  useAuthorisation,
  useBlockMap,
  useUnsavedChangesDialog
} from '@wepublish/ui/editor'
import React, {useCallback, useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {
  MdCloudUpload,
  MdIntegrationInstructions,
  MdKeyboardBackspace,
  MdRemoveRedEye,
  MdSave
} from 'react-icons/md'
import {Link, useNavigate, useParams} from 'react-router-dom'
import {
  Badge,
  Drawer,
  IconButton as RIconButton,
  Message,
  Modal,
  Notification,
  Tag as RTag,
  toaster
} from 'rsuite'
import {Node} from 'slate'

import {ClientSettings} from '../../../shared/types'

const IconButtonMarginTop = styled(RIconButton)`
  margin-top: 4px;
`

const IconButton = styled(RIconButton)`
  margin-left: 10px;
`

const CenterChildren = styled.div`
  margin-top: 4px;
  margin-bottom: 20px;
`

const Legend = styled.legend`
  width: auto;
  margin: 0px auto;
`

const FieldSet = styled('fieldset', {
  shouldForwardProp: prop => prop !== 'stateColor'
})<{stateColor: string}>`
  border-color: ${({stateColor}) => stateColor};
`

const Tag = styled(RTag, {
  shouldForwardProp: prop => prop !== 'stateColor'
})<{stateColor: string}>`
  background-color: ${({stateColor}) => stateColor};
`

const InitialArticleBlocks: BlockValue[] = [
  {key: '0', type: BlockType.Title, value: {title: '', lead: ''}},
  {key: '1', type: BlockType.Image, value: {image: null, caption: ''}}
]

function countRichtextChars(blocksCharLength: number, nodes: Node[]): number {
  return nodes.reduce((charLength: number, node) => {
    if (!node.text && !node.children) return charLength
    // node either has text (leaf node) or children (element node)
    if (node.text) {
      return charLength + (node.text as string).length
    }

    return countRichtextChars(charLength, node.children as Node[])
  }, blocksCharLength)
}

function ArticleEditor() {
  const navigate = useNavigate()
  const params = useParams()
  const {id} = params

  const [previewLinkFetch, {data}] = useArticlePreviewLinkLazyQuery({
    fetchPolicy: 'no-cache'
  })

  useEffect(() => {
    if (data?.articlePreviewLink) {
      window.open(data?.articlePreviewLink)
    }
  }, [data?.articlePreviewLink])

  const {t} = useTranslation()

  const {peerByDefault}: ClientSettings = getSettings()

  const [createArticle, {loading: isCreating, data: createData, error: createError}] =
    useCreateArticleMutation()

  const [updateArticle, {loading: isUpdating, error: updateError}] = useUpdateArticleMutation({
    fetchPolicy: 'no-cache'
  })

  const [publishArticle, {data: publishData, loading: isPublishing, error: publishError}] =
    usePublishArticleMutation({
      fetchPolicy: 'no-cache'
    })

  const [isMetaDrawerOpen, setMetaDrawerOpen] = useState(false)
  const [isPublishDialogOpen, setPublishDialogOpen] = useState(false)

  const [publishedAt, setPublishedAt] = useState<Date>()

  const [updatedAt, setUpdatedAt] = useState<Date>()

  const [publishAt, setPublishAt] = useState<Date>()

  const [metadata, setMetadata] = useState<ArticleMetadata>({
    slug: '',
    preTitle: '',
    title: '',
    lead: '',
    seoTitle: '',
    authors: [],
    tags: [],
    url: '',
    properties: [],
    canonicalUrl: '',
    shared: peerByDefault,
    hidden: false,
    breaking: false,
    image: undefined,
    hideAuthor: false,
    socialMediaTitle: undefined,
    socialMediaDescription: undefined,
    socialMediaAuthors: [],
    socialMediaImage: undefined
  })

  const isNew = id === undefined
  const [blocks, setBlocks] = useState<BlockValue[]>(isNew ? InitialArticleBlocks : [])

  const articleID = id || createData?.createArticle.id

  const {
    data: articleData,
    refetch,
    loading: isLoading
  } = useArticleQuery({
    errorPolicy: 'all',
    fetchPolicy: 'no-cache',
    variables: {id: articleID!}
  })

  const isNotFound = articleData && !articleData.article
  const isDisabled = isLoading || isCreating || isUpdating || isPublishing || isNotFound
  const canPreview = Boolean(articleData?.article?.draft)
  const pendingPublishDate = publishData?.publishArticle?.pending?.publishAt
    ? new Date(publishData?.publishArticle?.pending?.publishAt)
    : articleData?.article?.pending?.publishAt
    ? new Date(articleData?.article?.pending?.publishAt)
    : undefined

  const [hasChanged, setChanged] = useState(false)

  const unsavedChangesDialog = useUnsavedChangesDialog(hasChanged)

  const isAuthorized = useAuthorisation('CAN_CREATE_ARTICLE')

  const handleChange = useCallback((blocks: React.SetStateAction<BlockValue[]>) => {
    setBlocks(blocks)
    setChanged(true)
  }, [])

  useEffect(() => {
    if (articleData?.article) {
      const {latest, shared, hidden, pending, tags} = articleData.article
      const {
        slug,
        preTitle,
        title,
        seoTitle,
        lead,
        url,
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
        socialMediaImage
      } = latest

      const {publishedAt} = latest ?? {}
      if (publishedAt) setPublishedAt(new Date(publishedAt))

      const {updatedAt} = latest ?? {}
      if (updatedAt) setUpdatedAt(new Date(updatedAt))

      const {publishAt} = pending ?? latest
      if (publishAt) setPublishAt(new Date(publishAt))

      setMetadata({
        slug,
        preTitle: preTitle ?? '',
        title: title ?? '',
        lead: lead ?? '',
        seoTitle: seoTitle ?? '',
        tags: tags.map(({id}) => id),
        url,
        properties: properties.map(property => ({
          key: property.key,
          value: property.value,
          public: property.public
        })),
        canonicalUrl: canonicalUrl ?? '',
        shared,
        hidden,
        breaking,
        authors: authors.filter(author => author != null) as AuthorRefFragment[],
        image: image || undefined,
        hideAuthor,
        socialMediaTitle: socialMediaTitle || '',
        socialMediaDescription: socialMediaDescription || '',
        socialMediaAuthors: socialMediaAuthors?.filter(
          socialMediaAuthor => socialMediaAuthor != null
        ) as AuthorRefFragment[],
        socialMediaImage: socialMediaImage || undefined
      })

      setBlocks(blocks.map(blockForQueryBlock))
    }
  }, [articleData])

  const [stateColor, setStateColor] = useState<StateColor>(StateColor.none)
  const [tagTitle, setTagTitle] = useState<string>('')

  useEffect(() => {
    if (articleData?.article?.pending) {
      setStateColor(StateColor.pending)
      setTagTitle(
        t('articleEditor.overview.pending', {
          date: new Date(articleData?.article?.pending?.publishAt ?? '')
        })
      )
    } else if (articleData?.article?.published) {
      setStateColor(StateColor.published)
      setTagTitle(
        t('articleEditor.overview.published', {
          date: new Date(articleData?.article?.published?.publishedAt ?? '')
        })
      )
    } else {
      setStateColor(StateColor.draft)
      setTagTitle(t('articleEditor.overview.unpublished'))
    }
  }, [articleData, hasChanged, t])

  useEffect(() => {
    const error = createError?.message ?? updateError?.message ?? publishError?.message
    if (error)
      toaster.push(
        <Message type="error" showIcon closable duration={0}>
          {error}
        </Message>
      )
  }, [createError, updateError, publishError])

  function countRichTextBlocksChars(block: RichTextBlockListValue) {
    return countRichtextChars(0, block.value.richText)
  }

  function countTitleChars(block: TitleBlockListValue): number {
    return block.value.title.length + block.value.lead.length
  }

  function countQuoteChars(block: QuoteBlockListValue) {
    return block.value.quote.length + block.value.author.length
  }

  function countListicleChars(block: ListicleBlockListValue) {
    const titleArray = block.value.items.map(item => {
      return item.value.title.length
    })

    const totalTitleChars = titleArray.reduce(function (charCount: number, b) {
      return charCount + b
    })

    const richTextBlocks = block.value.items.map(item => item.value.richText)

    const richTextBlocksCount = richTextBlocks.reduce(
      (charCount: number, item) => charCount + countRichtextChars(0, item),
      0
    )

    return totalTitleChars + richTextBlocksCount
  }

  function wordCounter(blocks: BlockValue[]): number {
    return blocks.reduce((charLength: number, block: BlockValue) => {
      switch (block.type) {
        case BlockType.Listicle:
          return charLength + countListicleChars(block)
        case BlockType.Title:
          return charLength + countTitleChars(block)
        case BlockType.Quote:
          return charLength + countQuoteChars(block)
        case BlockType.RichText:
          return charLength + countRichTextBlocksChars(block)
        default:
          return charLength
      }
    }, 0)
  }

  function createInput(): ArticleInput {
    return {
      slug: metadata.slug,
      preTitle: metadata.preTitle || undefined,
      title: metadata.title,
      lead: metadata.lead,
      seoTitle: metadata.seoTitle,
      authorIDs: metadata.authors.map(({id}) => id),
      imageID: metadata.image?.id,
      breaking: metadata.breaking,
      shared: metadata.shared,
      hidden: metadata.hidden ?? false,
      tags: metadata.tags,
      canonicalUrl: metadata.canonicalUrl,
      properties: metadata.properties,
      blocks: blocks.map(unionMapForBlock),
      hideAuthor: metadata.hideAuthor,
      socialMediaTitle: metadata.socialMediaTitle || undefined,
      socialMediaDescription: metadata.socialMediaDescription || undefined,
      socialMediaAuthorIDs: metadata.socialMediaAuthors.map(({id}) => id),
      socialMediaImageID: metadata.socialMediaImage?.id || undefined
    }
  }

  // Reads title and lead from the first block and saves them in variables
  function syncFirstTitleBlockWithMetadata() {
    if (
      metadata.title === '' &&
      metadata.lead === '' &&
      metadata.seoTitle === '' &&
      blocks.length > 0
    ) {
      const titleBlock = blocks.find(block => block.type === BlockType.Title)

      if (titleBlock?.value) {
        const titleBlockValue = titleBlock.value as TitleBlockValue
        setMetadata({
          ...metadata,
          title: titleBlockValue.title,
          lead: titleBlockValue.lead,
          seoTitle: titleBlockValue.title
        })
      }
    }
  }

  async function handleSave() {
    const input = createInput()

    if (articleID) {
      await updateArticle({variables: {id: articleID, input}})

      setChanged(false)
      toaster.push(
        <Notification
          type="success"
          header={t('articleEditor.overview.draftSaved')}
          duration={2000}
        />,
        {placement: 'topEnd'}
      )
      await refetch({id: articleID})
    } else {
      const {data} = await createArticle({variables: {input}})
      if (data) {
        navigate(`/articles/edit/${data?.createArticle.id}`, {replace: true})
      }
      setChanged(false)
      toaster.push(
        <Notification
          type="success"
          header={t('articleEditor.overview.draftCreated')}
          duration={2000}
        />,
        {placement: 'topEnd'}
      )
    }
  }

  async function handlePublish(publishedAt: Date, publishAt: Date, updatedAt?: Date) {
    if (!metadata.slug) {
      toaster.push(
        <Message type="error" showIcon closable duration={0}>
          {t('articleEditor.overview.noSlug')}
        </Message>
      )
      return
    }

    if (articleID) {
      const {data} = await updateArticle({
        variables: {id: articleID, input: createInput()}
      })

      if (data) {
        const {data: publishData} = await publishArticle({
          variables: {
            id: articleID,
            publishAt: publishAt ? publishAt.toISOString() : publishedAt.toISOString(),
            publishedAt: publishedAt.toISOString(),
            updatedAt: updatedAt ? updatedAt.toISOString() : publishedAt.toISOString()
          }
        })

        if (publishData?.publishArticle?.latest?.publishedAt) {
          setPublishedAt(new Date(publishData?.publishArticle?.latest.publishedAt))
        }
        if (publishData?.publishArticle?.latest?.updatedAt) {
          setUpdatedAt(new Date(publishData?.publishArticle?.latest.updatedAt))
        }
        if (publishData?.publishArticle?.latest?.publishAt) {
          setPublishAt(new Date(publishData?.publishArticle?.latest.publishAt))
        } else if (
          publishData?.publishArticle?.latest?.publishAt === null &&
          publishData?.publishArticle?.latest?.publishedAt
        ) {
          setPublishAt(new Date(publishData?.publishArticle?.latest?.publishedAt))
        }
      }
      setChanged(false)
      toaster.push(
        <Notification
          type="success"
          header={t(
            publishAt <= new Date() || (!publishAt && publishedAt <= new Date())
              ? 'articleEditor.overview.articlePublished'
              : 'articleEditor.overview.articlePending'
          )}
          duration={2000}
        />,
        {placement: 'topEnd'}
      )
    }
    await refetch({id: articleID})
  }

  useEffect(() => {
    if (isNotFound) {
      toaster.push(
        <Message type="error" showIcon closable duration={0}>
          {t('articleEditor.overview.notFound')}
        </Message>
      )
    }
  }, [isNotFound])

  const [infoData, setInfoData] = useState<InfoData>({
    charCount: 0
  })

  useEffect(() => {
    setInfoData({
      charCount: wordCounter(blocks)
    })
  }, [isMetaDrawerOpen])

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
                      if (!unsavedChangesDialog()) e.preventDefault()
                    }}>
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
                      syncFirstTitleBlockWithMetadata()
                      setMetaDrawerOpen(true)
                    }}>
                    {t('articleEditor.overview.metadata')}
                  </RIconButton>

                  {isNew && createData == null ? (
                    <PermissionControl qualifyingPermissions={['CAN_CREATE_ARTICLE']}>
                      <IconButton
                        className="actionButton"
                        size="lg"
                        icon={<MdSave />}
                        disabled={isDisabled}
                        onClick={() => handleSave()}>
                        {t('create')}
                      </IconButton>
                    </PermissionControl>
                  ) : (
                    <PermissionControl qualifyingPermissions={['CAN_CREATE_ARTICLE']}>
                      <Badge className={hasChanged ? 'unsaved' : 'saved'}>
                        <IconButton
                          className="actionButton"
                          size="lg"
                          icon={<MdSave />}
                          disabled={isDisabled}
                          onClick={() => handleSave()}>
                          {t('save')}
                        </IconButton>
                      </Badge>
                      <PermissionControl qualifyingPermissions={['CAN_PUBLISH_ARTICLE']}>
                        <Badge
                          className={
                            articleData?.article?.draft || !articleData?.article?.published
                              ? 'unsaved'
                              : 'saved'
                          }>
                          <IconButton
                            className="actionButton"
                            size="lg"
                            icon={<MdCloudUpload />}
                            disabled={isDisabled}
                            onClick={() => {
                              setPublishDialogOpen(true)
                            }}>
                            {t('articleEditor.overview.publish')}
                          </IconButton>
                        </Badge>
                      </PermissionControl>
                    </PermissionControl>
                  )}
                </CenterChildren>
              }
              rightChildren={
                <PermissionControl qualifyingPermissions={['CAN_GET_ARTICLE_PREVIEW_LINK']}>
                  <Link
                    to="#"
                    className="actionButton"
                    onClick={e => {
                      previewLinkFetch({
                        variables: {
                          id: id!,
                          hours: 1
                        }
                      })
                    }}>
                    <IconButtonMarginTop
                      disabled={hasChanged || !id || !canPreview}
                      size="lg"
                      icon={<MdRemoveRedEye />}>
                      {t('articleEditor.overview.preview')}
                    </IconButtonMarginTop>
                  </Link>
                </PermissionControl>
              }
            />
          }>
          <BlockList
            itemId={articleID}
            value={blocks}
            onChange={handleChange}
            disabled={isLoading || isDisabled || !isAuthorized}>
            {useBlockMap<BlockValue>(() => BlockMap, [])}
          </BlockList>
        </EditorTemplate>
      </FieldSet>
      <Drawer open={isMetaDrawerOpen} size="md" onClose={() => setMetaDrawerOpen(false)}>
        <ArticleMetadataPanel
          articleID={articleID}
          value={metadata}
          infoData={infoData}
          onClose={() => {
            handleSave()
            setMetaDrawerOpen(false)
          }}
          onChange={value => {
            setMetadata(value)
            setChanged(true)
          }}
        />
      </Drawer>
      <Modal open={isPublishDialogOpen} size="sm" onClose={() => setPublishDialogOpen(false)}>
        <PublishArticlePanel
          publishedAtDate={publishedAt}
          updatedAtDate={updatedAt}
          pendingPublishDate={pendingPublishDate}
          publishAtDate={publishAt}
          metadata={metadata}
          onClose={() => setPublishDialogOpen(false)}
          onConfirm={(publishedAt, publishAt, updatedAt) => {
            handlePublish(publishedAt, publishAt, updatedAt)
            setPublishDialogOpen(false)
          }}
        />
      </Modal>
    </>
  )
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_ARTICLE',
  'CAN_GET_ARTICLES',
  'CAN_CREATE_ARTICLE',
  'CAN_DELETE_ARTICLE'
])(ArticleEditor)
export {CheckedPermissionComponent as ArticleEditor}
