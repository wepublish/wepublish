import React, {useState, useEffect, useCallback} from 'react'

import {Drawer, Modal, Notification, Icon, IconButton} from 'rsuite'

import {BlockList, useBlockMap} from '../atoms/blockList'
import {EditorTemplate} from '../atoms/editorTemplate'
import {NavigationBar} from '../atoms/navigationBar'

import {RouteActionType} from '@karma.run/react'

import {ArticleListRoute, useRouteDispatch, ArticleEditRoute, IconButtonLink} from '../route'

import {ArticleMetadataPanel, ArticleMetadata} from '../panel/articleMetadataPanel'
import {PublishArticlePanel} from '../panel/publishArticlePanel'

import {
  useCreateArticleMutation,
  useArticleQuery,
  useUpdateArticleMutation,
  ArticleInput,
  usePublishArticleMutation,
  AuthorRefFragment
} from '../api'

import {BlockType, blockForQueryBlock, unionMapForBlock, BlockValue} from '../blocks/types'

import {useUnsavedChangesDialog} from '../unsavedChangesDialog'
import {BlockMap} from '../blocks/blockMap'

import {useTranslation} from 'react-i18next'

export interface ArticleEditorProps {
  readonly id?: string
}

const InitialArticleBlocks: BlockValue[] = [
  {key: '0', type: BlockType.Title, value: {title: '', lead: ''}},
  {key: '1', type: BlockType.Image, value: {image: null, caption: ''}}
]

export function ArticleEditor({id}: ArticleEditorProps) {
  const {t} = useTranslation()

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
  const [metadata, setMetadata] = useState<ArticleMetadata>({
    slug: '',
    preTitle: '',
    title: '',
    lead: '',
    authors: [],
    tags: [],
    properties: [],
    shared: false,
    breaking: false,
    image: undefined
  })

  const isNew = id === undefined
  const [blocks, setBlocks] = useState<BlockValue[]>(isNew ? InitialArticleBlocks : [])

  const articleID = id || createData?.createArticle.id

  const {data: articleData, loading: isLoading} = useArticleQuery({
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
      const {latest, published, shared} = articleData.article
      const {
        slug,
        preTitle,
        title,
        lead,
        tags,
        breaking,
        authors,
        image,
        blocks,
        properties
      } = latest
      const {publishedAt} = published ?? {}

      if (publishedAt) setPublishedAt(new Date(publishedAt))

      setMetadata({
        slug,
        preTitle: preTitle ?? '',
        title,
        lead: lead ?? '',
        tags,
        properties: properties.map(property => ({
          key: property.key,
          value: property.value,
          public: property.public
        })),
        shared,
        breaking,
        authors: authors.filter(author => author != null) as AuthorRefFragment[],
        image: image || undefined
      })

      setBlocks(blocks.map(blockForQueryBlock))
    }
  }, [articleData])

  useEffect(() => {
    if (createError || updateError || publishError) {
      Notification.error({
        title: updateError?.message ?? createError?.message ?? publishError!.message,
        duration: 5000
      })
    }
  }, [createError, updateError, publishError])

  function createInput(): ArticleInput {
    return {
      slug: metadata.slug,
      preTitle: metadata.preTitle || undefined,
      title: metadata.title,
      lead: metadata.lead,
      authorIDs: metadata.authors.map(({id}) => id),
      imageID: metadata.image?.id,
      breaking: metadata.breaking,
      shared: metadata.shared,
      tags: metadata.tags,
      properties: metadata.properties,
      blocks: blocks.map(unionMapForBlock)
    }
  }

  async function handleSave() {
    const input = createInput()

    if (articleID) {
      await updateArticle({variables: {id: articleID, input}})

      setChanged(false)
      Notification.success({
        title: t('articleEditor.overview.draftSaved'),
        duration: 2000
      })
    } else {
      const {data} = await createArticle({variables: {input}})

      if (data) {
        dispatch({
          type: RouteActionType.ReplaceRoute,
          route: ArticleEditRoute.create({id: data?.createArticle.id})
        })
      }
      setChanged(false)
      Notification.success({
        title: t('articleEditor.overview.draftCreated'),
        duration: 2000
      })
    }
  }

  async function handlePublish(publishDate: Date, updateDate: Date) {
    if (articleID) {
      const {data} = await updateArticle({
        variables: {id: articleID, input: createInput()}
      })

      if (data) {
        const {data: publishData} = await publishArticle({
          variables: {
            id: articleID,
            publishAt: publishDate.toISOString(),
            publishedAt: publishDate.toISOString(),
            updatedAt: updateDate.toISOString()
          }
        })

        if (publishData?.publishArticle?.published?.publishedAt) {
          setPublishedAt(new Date(publishData?.publishArticle?.published.publishedAt))
        }
      }

      setChanged(false)
      Notification.success({
        title: t('articleEditor.overview.articlePublished'),
        duration: 2000
      })
    }
  }

  useEffect(() => {
    if (isNotFound) {
      Notification.error({
        title: t('articleEditor.overview.notFound'),
        duration: 5000
      })
    }
  }, [isNotFound])

  return (
    <>
      <EditorTemplate
        navigationChildren={
          <NavigationBar
            leftChildren={
              <IconButtonLink
                size={'lg'}
                icon={<Icon icon="arrow-left" />}
                route={ArticleListRoute.create({})}
                onClick={e => {
                  if (!unsavedChangesDialog()) e.preventDefault()
                }}>
                {t('articleEditor.overview.back')}
              </IconButtonLink>
            }
            centerChildren={
              <>
                <IconButton
                  icon={<Icon icon="newspaper-o" />}
                  size={'lg'}
                  disabled={isDisabled}
                  onClick={() => setMetaDrawerOpen(true)}>
                  {t('articleEditor.overview.metadata')}
                </IconButton>

                {isNew && createData == null ? (
                  <IconButton
                    style={{
                      marginLeft: '10px'
                    }}
                    size={'lg'}
                    icon={<Icon icon="save" />}
                    disabled={isDisabled}
                    onClick={() => handleSave()}>
                    {t('articleEditor.overview.create')}
                  </IconButton>
                ) : (
                  <>
                    <IconButton
                      style={{
                        marginLeft: '10px'
                      }}
                      size={'lg'}
                      icon={<Icon icon="save" />}
                      disabled={isDisabled}
                      onClick={() => handleSave()}>
                      {t('articleEditor.overview.save')}
                    </IconButton>
                    <IconButton
                      style={{
                        marginLeft: '10px'
                      }}
                      size={'lg'}
                      icon={<Icon icon="cloud-upload" />}
                      disabled={isDisabled}
                      onClick={() => setPublishDialogOpen(true)}>
                      {t('articleEditor.overview.publish')}
                    </IconButton>
                  </>
                )}
              </>
            }
          />
        }>
        <BlockList value={blocks} onChange={handleChange} disabled={isLoading || isDisabled}>
          {useBlockMap<BlockValue>(() => BlockMap, [])}
        </BlockList>
      </EditorTemplate>
      <Drawer show={isMetaDrawerOpen} size={'sm'} onHide={() => setMetaDrawerOpen(false)}>
        <ArticleMetadataPanel
          value={metadata}
          onClose={() => setMetaDrawerOpen(false)}
          onChange={value => {
            setMetadata(value)
            setChanged(true)
          }}
        />
      </Drawer>
      <Modal show={isPublishDialogOpen} size={'sm'} onHide={() => setPublishDialogOpen(false)}>
        <PublishArticlePanel
          initialPublishDate={publishedAt}
          pendingPublishDate={pendingPublishDate}
          metadata={metadata}
          onClose={() => setPublishDialogOpen(false)}
          onConfirm={(publishDate, updateDate) => {
            handlePublish(publishDate, updateDate)
            setPublishDialogOpen(false)
          }}
        />
      </Modal>
    </>
  )
}
