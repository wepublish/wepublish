import React, {useState, useEffect, useCallback} from 'react'

import {RouteActionType} from '@karma.run/react'

import {BlockList, useBlockMap} from '../atoms/blockList'
import {NavigationBar} from '../atoms/navigationBar'
import {EditorTemplate} from '../atoms/editorTemplate'

import {useRouteDispatch, PageEditRoute, PageListRoute, IconButtonLink} from '../route'

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

import {useTranslation} from 'react-i18next'
import {Icon, IconButton, Drawer, Modal, Notification} from 'rsuite'

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

  const {t} = useTranslation()

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
      Notification.error({
        title: updateError?.message ?? createError?.message ?? publishError!.message,
        duration: 5000
      })
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
      Notification.success({
        title: 'Page Draft Saved',
        duration: 2000
      })
    } else {
      const {data} = await createPage({variables: {input}})

      if (data) {
        dispatch({
          type: RouteActionType.ReplaceRoute,
          route: PageEditRoute.create({id: data?.createPage.id})
        })
      }

      setChanged(false)
      Notification.success({
        title: 'Page Draft Created',
        duration: 2000
      })
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
    Notification.success({
      title: 'Page Published',
      duration: 2000
    })
  }

  useEffect(() => {
    if (isNotFound) {
      Notification.error({
        title: 'Page Not Found',
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
                route={PageListRoute.create({})}
                onClick={e => {
                  if (!unsavedChangesDialog()) e.preventDefault()
                }}>
                {t('Back')}
              </IconButtonLink>
            }
            centerChildren={
              <>
                <IconButton
                  icon={<Icon icon="newspaper-o" />}
                  size={'lg'}
                  disabled={isDisabled}
                  onClick={() => setMetaDrawerOpen(true)}>
                  {t('Metadata')}
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
                    {t('Create')}
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
                      {t('Save')}
                    </IconButton>
                    <IconButton
                      style={{
                        marginLeft: '10px'
                      }}
                      size={'lg'}
                      icon={<Icon icon="cloud-upload" />}
                      disabled={isDisabled}
                      onClick={() => setPublishDialogOpen(true)}>
                      {t('Publish')}
                    </IconButton>
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

      <Drawer show={isMetaDrawerOpen} size={'sm'} onHide={() => setMetaDrawerOpen(false)}>
        <PageMetadataPanel
          value={metadata}
          onClose={() => setMetaDrawerOpen(false)}
          onChange={value => {
            setMetadata(value)
            setChanged(true)
          }}
        />
      </Drawer>

      <Modal show={isPublishDialogOpen} size={'sm'} onHide={() => setPublishDialogOpen(false)}>
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
      </Modal>
    </>
  )
}
