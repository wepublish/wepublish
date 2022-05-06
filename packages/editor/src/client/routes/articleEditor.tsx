import React, {useCallback, useEffect, useState} from 'react'

import {toaster, Message, Badge, Drawer, IconButton, Modal, Notification, Tag} from 'rsuite'

import {BlockList, useBlockMap} from '../atoms/blockList'
import {EditorTemplate} from '../atoms/editorTemplate'
import {NavigationBar} from '../atoms/navigationBar'

import {RouteActionType} from '@wepublish/karma.run-react'

import {ArticleEditRoute, ArticleListRoute, IconButtonLink, useRouteDispatch} from '../route'

import {ArticleMetadata, ArticleMetadataPanel, InfoData} from '../panel/articleMetadataPanel'
import {PublishArticlePanel} from '../panel/publishArticlePanel'

import {
  ArticleInput,
  AuthorRefFragment,
  useArticleQuery,
  useCreateArticleMutation,
  usePublishArticleMutation,
  useUpdateArticleMutation,
  useArticlePreviewLinkLazyQuery
} from '../api'

import {
  blockForQueryBlock,
  BlockType,
  BlockValue,
  ListicleBlockListValue,
  QuoteBlockListValue,
  RichTextBlockListValue,
  TitleBlockListValue,
  TitleBlockValue,
  unionMapForBlock
} from '../blocks/types'

import {useUnsavedChangesDialog} from '../unsavedChangesDialog'
import {BlockMap} from '../blocks/blockMap'

import {useTranslation} from 'react-i18next'
import {StateColor} from '../utility'
import {ClientSettings} from '../../shared/types'
import {ElementID} from '../../shared/elementID'
import ArrowLeftIcon from '@rsuite/icons/legacy/ArrowLeft'
import EyeIcon from '@rsuite/icons/legacy/Eye'
import SaveIcon from '@rsuite/icons/legacy/Save'
import NewspaperOIcon from '@rsuite/icons/legacy/NewspaperO'
import CloudUploadIcon from '@rsuite/icons/legacy/CloudUpload'

export interface ArticleEditorProps {
  readonly id?: string
}

const InitialArticleBlocks: BlockValue[] = [
  {key: '0', type: BlockType.Title, value: {title: '', lead: ''}},
  {key: '1', type: BlockType.Image, value: {image: null, caption: ''}}
]

export function ArticleEditor({id}: ArticleEditorProps) {
  const [previewLinkFetch, {data}] = useArticlePreviewLinkLazyQuery({
    fetchPolicy: 'no-cache'
  })

  useEffect(() => {
    if (data?.articlePreviewLink) {
      window.open(data?.articlePreviewLink)
    }
  }, [data?.articlePreviewLink])

  const {t} = useTranslation()

  const {peerByDefault}: ClientSettings = JSON.parse(
    document.getElementById(ElementID.Settings)!.textContent!
  )

  const dispatch = useRouteDispatch()

  const [
    createArticle,
    {loading: isCreating, data: createData, error: createError}
  ] = useCreateArticleMutation()

  const [updateArticle, {loading: isUpdating, error: updateError}] = useUpdateArticleMutation({
    fetchPolicy: 'no-cache'
  })

  const [
    publishArticle,
    {data: publishData, loading: isPublishing, error: publishError}
  ] = usePublishArticleMutation({
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

  const {data: articleData, refetch, loading: isLoading} = useArticleQuery({
    skip: isNew || createData != null,
    errorPolicy: 'all',
    fetchPolicy: 'no-cache',
    variables: {id: articleID!}
  })

  const isNotFound = articleData && !articleData.article
  const isDisabled = isLoading || isCreating || isUpdating || isPublishing || isNotFound
  const pendingPublishDate = publishData?.publishArticle?.pending?.publishAt
    ? new Date(publishData?.publishArticle?.pending?.publishAt)
    : articleData?.article?.pending?.publishAt
    ? new Date(articleData?.article?.pending?.publishAt)
    : undefined

  const [hasChanged, setChanged] = useState(false)

  const unsavedChangesDialog = useUnsavedChangesDialog(hasChanged)

  const handleChange = useCallback((blocks: React.SetStateAction<BlockValue[]>) => {
    setBlocks(blocks)
    setChanged(true)
  }, [])

  useEffect(() => {
    if (articleData?.article) {
      const {latest, shared, pending} = articleData.article
      const {
        slug,
        preTitle,
        title,
        seoTitle,
        lead,
        tags,
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
        tags,
        url,
        properties: properties.map(property => ({
          key: property.key,
          value: property.value,
          public: property.public
        })),
        canonicalUrl: canonicalUrl ?? '',
        shared,
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
  }, [articleData, hasChanged])

  useEffect(() => {
    const error = createError?.message ?? updateError?.message ?? publishError?.message
    if (error)
      toaster.push(
        <Message type="error" showIcon closable duration={0}>
          {error}
        </Message>
      )
  }, [createError, updateError, publishError])

  function countRichtextChars(blocksCharLength: number, nodes: any) {
    return nodes.reduce((charLength: number, node: any) => {
      if (!node.text && !node.children) return charLength
      // node either has text (leaf node) or children (element node)
      if (node.text) {
        return charLength + (node.text as string).length
      }
      return countRichtextChars(charLength, node.children)
    }, blocksCharLength)
  }

  function countRichTextBlocksChars(block: RichTextBlockListValue) {
    return countRichtextChars(0, block.value)
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
        dispatch({
          type: RouteActionType.ReplaceRoute,
          route: ArticleEditRoute.create({id: data?.createArticle.id})
        })
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
      <fieldset style={{borderColor: stateColor}}>
        <legend style={{width: 'auto', margin: '0px auto'}}>
          <Tag style={{backgroundColor: stateColor}}>{tagTitle}</Tag>
        </legend>
        <EditorTemplate
          navigationChildren={
            <NavigationBar
              leftChildren={
                <IconButtonLink
                  style={{marginTop: '4px'}}
                  size={'lg'}
                  icon={<ArrowLeftIcon />}
                  route={ArticleListRoute.create({})}
                  onClick={e => {
                    if (!unsavedChangesDialog()) e.preventDefault()
                  }}>
                  {t('articleEditor.overview.back')}
                </IconButtonLink>
              }
              centerChildren={
                <div style={{marginTop: '4px', marginBottom: '20px'}}>
                  <IconButton
                    icon={<NewspaperOIcon />}
                    size={'lg'}
                    disabled={isDisabled}
                    onClick={() => {
                      syncFirstTitleBlockWithMetadata()
                      setMetaDrawerOpen(true)
                    }}>
                    {t('articleEditor.overview.metadata')}
                  </IconButton>

                  {isNew && createData == null ? (
                    <IconButton
                      style={{
                        marginLeft: '10px'
                      }}
                      size={'lg'}
                      icon={<SaveIcon />}
                      disabled={isDisabled}
                      onClick={() => handleSave()}>
                      {t('articleEditor.overview.create')}
                    </IconButton>
                  ) : (
                    <>
                      <Badge className={hasChanged ? 'unsaved' : 'saved'}>
                        <IconButton
                          style={{
                            marginLeft: '10px'
                          }}
                          size={'lg'}
                          icon={<SaveIcon />}
                          disabled={isDisabled}
                          onClick={() => handleSave()}>
                          {t('articleEditor.overview.save')}
                        </IconButton>
                      </Badge>
                      <Badge
                        className={
                          articleData?.article?.draft || !articleData?.article?.published
                            ? 'unsaved'
                            : 'saved'
                        }>
                        <IconButton
                          style={{
                            marginLeft: '10px'
                          }}
                          size={'lg'}
                          icon={<CloudUploadIcon />}
                          disabled={isDisabled}
                          onClick={() => {
                            setPublishDialogOpen(true)
                          }}>
                          {t('articleEditor.overview.publish')}
                        </IconButton>
                      </Badge>
                    </>
                  )}
                </div>
              }
              rightChildren={
                <IconButtonLink
                  disabled={hasChanged || !id}
                  style={{marginTop: '4px'}}
                  size={'lg'}
                  icon={<EyeIcon />}
                  onClick={e => {
                    previewLinkFetch({
                      variables: {
                        id: id!,
                        hours: 1
                      }
                    })
                  }}>
                  {t('articleEditor.overview.preview')}
                </IconButtonLink>
              }
            />
          }>
          <BlockList value={blocks} onChange={handleChange} disabled={isLoading || isDisabled}>
            {useBlockMap<BlockValue>(() => BlockMap, [])}
          </BlockList>
        </EditorTemplate>
      </fieldset>
      <Drawer open={isMetaDrawerOpen} size={'sm'} onClose={() => setMetaDrawerOpen(false)}>
        <ArticleMetadataPanel
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
      <Modal open={isPublishDialogOpen} size={'sm'} onClose={() => setPublishDialogOpen(false)}>
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
