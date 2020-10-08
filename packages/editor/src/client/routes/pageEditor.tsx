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

import {RouteNavigationLinkButton, useRouteDispatch, PageEditRoute, PageListRoute} from '../route'

import {
  PageInput,
  useCreatePageMutation,
  useUpdatePageMutation,
  usePageQuery,
  usePublishPageMutation
} from '../api'

import {PageMetadata, PageMetadataPanel} from '../panel/pageMetadataPanel'
import {PublishPagePanel} from '../panel/publishPagePanel'

import {blockForQueryBlock, unionMapForBlock, BlockValue} from '../blocks/types'

import {useUnsavedChangesDialog} from '../unsavedChangesDialog'
import {BlockMap} from '../blocks/blockMap'

export interface PageEditorProps {
  readonly id?: string
}

export function PageEditor({id}: PageEditorProps) {
  const dispatch = useRouteDispatch()

  const [
    createPage,
    {data: createData, loading: isCreating, error: createError}
  ] = useCreatePageMutation()

  const [updatePage, {loading: isUpdating, error: updateError}] = useUpdatePageMutation({
    fetchPolicy: 'no-cache'
  })

  const [
    publishPage,
    {data: publishData, loading: isPublishing, error: publishError}
  ] = usePublishPageMutation({
    fetchPolicy: 'no-cache'
  })

  const [isMetaDrawerOpen, setMetaDrawerOpen] = useState(false)
  const [isPublishDialogOpen, setPublishDialogOpen] = useState(false)

  const [isSuccessToastOpen, setSuccessToastOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [isErrorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [publishedAt, setPublishedAt] = useState<Date>()
  const [metadata, setMetadata] = useState<PageMetadata>({
    slug: '',
    title: '',
    description: '',
    tags: [],
    properties: [],
    image: undefined
  })

  const isNew = id === undefined
  const [blocks, setBlocks] = useState<BlockValue[]>([])

  const pageID = id || createData?.createPage.id

  const {data: pageData, loading: isLoading} = usePageQuery({
    skip: isNew || createData != null,
    errorPolicy: 'all',
    fetchPolicy: 'no-cache',
    variables: {id: pageID!}
  })

  const isNotFound = pageData && !pageData.page
  const isDisabled = isLoading || isCreating || isUpdating || isPublishing || isNotFound
  const pendingPublishDate = publishData?.publishPage?.pending?.publishAt
    ? new Date(publishData?.publishPage?.pending?.publishAt)
    : pageData?.page?.pending?.publishAt
    ? new Date(pageData?.page?.pending?.publishAt)
    : undefined

  const [hasChanged, setChanged] = useState(false)
  const unsavedChangesDialog = useUnsavedChangesDialog(hasChanged)

  const handleChange = useCallback((blocks: React.SetStateAction<BlockValue[]>) => {
    setBlocks(blocks)
    setChanged(true)
  }, [])

  useEffect(() => {
    if (pageData?.page) {
      const {latest, published} = pageData.page
      const {slug, title, description, tags, image, blocks, properties} = latest
      const {publishedAt} = published ?? {}

      if (publishedAt) setPublishedAt(new Date(publishedAt))

      setMetadata({
        slug,
        title,
        description: description ?? '',
        tags,
        properties: properties.map(property => ({
          key: property.key,
          value: property.value,
          public: property.public
        })),
        image: image || undefined
      })

      setBlocks(blocks.map(blockForQueryBlock))
    }
  }, [pageData])

  useEffect(() => {
    if (createError || updateError || publishError) {
      setErrorToastOpen(true)
      setErrorMessage(updateError?.message ?? createError?.message ?? publishError!.message)
    }
  }, [createError, updateError, publishError])

  function createInput(): PageInput {
    return {
      slug: metadata.slug,
      title: metadata.title,
      description: metadata.description,
      imageID: metadata.image?.id,
      tags: metadata.tags,
      properties: metadata.properties,
      blocks: blocks.map(unionMapForBlock)
    }
  }

  async function handleSave() {
    const input = createInput()

    if (pageID) {
      await updatePage({variables: {id: pageID, input}})

      setChanged(false)
      setSuccessToastOpen(true)
      setSuccessMessage('Page Draft Saved')
    } else {
      const {data} = await createPage({variables: {input}})

      if (data) {
        dispatch({
          type: RouteActionType.ReplaceRoute,
          route: PageEditRoute.create({id: data?.createPage.id})
        })
      }

      setChanged(false)
      setSuccessToastOpen(true)
      setSuccessMessage('Page Draft Created')
    }
  }

  async function handlePublish(publishDate: Date, updateDate: Date) {
    if (pageID) {
      const {data} = await updatePage({
        variables: {id: pageID, input: createInput()}
      })

      if (data) {
        const {data: publishData} = await publishPage({
          variables: {
            id: pageID,
            publishAt: publishDate.toISOString(),
            publishedAt: publishDate.toISOString(),
            updatedAt: updateDate.toISOString()
          }
        })

        if (publishData?.publishPage?.published?.publishedAt) {
          setPublishedAt(new Date(publishData?.publishPage?.published.publishedAt))
        }
      }
    }

    setChanged(false)
    setSuccessToastOpen(true)
    setSuccessMessage('Page Published')
  }

  useEffect(() => {
    if (isNotFound) {
      setErrorMessage('Page Not Found')
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
                route={PageListRoute.create({})}
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
        <BlockList value={blocks} onChange={handleChange} disabled={isDisabled}>
          {useBlockMap<BlockValue>(() => BlockMap, [])}
        </BlockList>
      </EditorTemplate>
      <Drawer open={isMetaDrawerOpen} width={480} onClose={() => setMetaDrawerOpen(false)}>
        {() => (
          <PageMetadataPanel
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
          <PublishPagePanel
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
