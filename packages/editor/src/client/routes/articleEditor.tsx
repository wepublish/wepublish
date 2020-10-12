import React, {useState, useEffect, useCallback} from 'react'

import {
  EditorTemplate,
  NavigationBar,
  NavigationButton,
  BlockList,
  Drawer,
  Toast,
  Dialog,
  useBlockMap
} from '@karma.run/ui'

import {
  MaterialIconArrowBack,
  MaterialIconInsertDriveFileOutlined,
  MaterialIconPublishOutlined,
  MaterialIconSaveOutlined
} from '@karma.run/icons'

import {RouteActionType} from '@karma.run/react'

import {
  RouteNavigationLinkButton,
  ArticleListRoute,
  useRouteDispatch,
  ArticleEditRoute
} from '../route'

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

export interface ArticleEditorProps {
  readonly id?: string
}

const InitialArticleBlocks: BlockValue[] = [
  {key: '0', type: BlockType.Title, value: {title: '', lead: ''}},
  {key: '1', type: BlockType.Image, value: {image: null, caption: ''}}
]

export function ArticleEditor({id}: ArticleEditorProps) {
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

  const [isSuccessToastOpen, setSuccessToastOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [isErrorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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
      setErrorToastOpen(true)
      setErrorMessage(updateError?.message ?? createError?.message ?? publishError!.message)
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
      setSuccessToastOpen(true)
      setSuccessMessage('Article Draft Saved')
    } else {
      const {data} = await createArticle({variables: {input}})

      if (data) {
        dispatch({
          type: RouteActionType.ReplaceRoute,
          route: ArticleEditRoute.create({id: data?.createArticle.id})
        })
      }

      setChanged(false)
      setSuccessToastOpen(true)
      setSuccessMessage('Article Draft Created')
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
      setSuccessToastOpen(true)
      setSuccessMessage('Article Published')
    }
  }

  useEffect(() => {
    if (isNotFound) {
      setErrorMessage('Article Not Found')
      setErrorToastOpen(true)
    }
  }, [isNotFound])

  return (
    <>
      <EditorTemplate
        navigationChildren={
          <NavigationBar
            leftChildren={
              <RouteNavigationLinkButton
                icon={MaterialIconArrowBack}
                label="Back"
                route={ArticleListRoute.create({})}
                onClick={e => {
                  if (!unsavedChangesDialog()) e.preventDefault()
                }}
              />
            }
            centerChildren={
              <>
                <NavigationButton
                  icon={MaterialIconInsertDriveFileOutlined}
                  label="Metadata"
                  onClick={() => setMetaDrawerOpen(true)}
                  disabled={isDisabled}
                />

                {isNew && createData == null ? (
                  <NavigationButton
                    icon={MaterialIconSaveOutlined}
                    label="Create"
                    onClick={() => handleSave()}
                    disabled={isDisabled}
                  />
                ) : (
                  <>
                    <NavigationButton
                      icon={MaterialIconSaveOutlined}
                      label="Save"
                      onClick={() => handleSave()}
                      disabled={isDisabled}
                    />
                    <NavigationButton
                      icon={MaterialIconPublishOutlined}
                      label="Publish"
                      onClick={() => setPublishDialogOpen(true)}
                      disabled={isDisabled}
                    />
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
      <Drawer open={isMetaDrawerOpen} width={480} onClose={() => setMetaDrawerOpen(false)}>
        {() => (
          <ArticleMetadataPanel
            value={metadata}
            onClose={() => setMetaDrawerOpen(false)}
            onChange={value => {
              setMetadata(value)
              setChanged(true)
            }}
          />
        )}
      </Drawer>
      <Dialog open={isPublishDialogOpen} width={480} onClose={() => setPublishDialogOpen(false)}>
        {() => (
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
        )}
      </Dialog>
      <Toast
        type="success"
        open={isSuccessToastOpen}
        autoHideDuration={2000}
        onClose={() => setSuccessToastOpen(false)}>
        {successMessage}
      </Toast>
      <Toast
        type="error"
        open={isErrorToastOpen}
        autoHideDuration={5000}
        onClose={() => setErrorToastOpen(false)}>
        {errorMessage}
      </Toast>
    </>
  )
}
