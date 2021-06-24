import React, {useCallback, useEffect, useState} from 'react'

import {RouteActionType} from '@karma.run/react'

import {BlockList, useBlockMap} from '../atoms/blockList'
import {NavigationBar} from '../atoms/navigationBar'
import {EditorTemplate} from '../atoms/editorTemplate'

import {IconButtonLink, PageEditRoute, PageListRoute, useRouteDispatch} from '../route'

import {
  PageInput,
  useCreatePageMutation,
  usePageQuery,
  usePublishPageMutation,
  useUpdatePageMutation
} from '../api'

import {PageMetadata, PageMetadataPanel} from '../panel/pageMetadataPanel'
import {PublishPagePanel} from '../panel/publishPagePanel'

import {blockForQueryBlock, BlockValue, unionMapForBlock} from '../blocks/types'

import {useUnsavedChangesDialog} from '../unsavedChangesDialog'
import {BlockMap} from '../blocks/blockMap'

import {useTranslation} from 'react-i18next'
import {Alert, Badge, Drawer, Icon, IconButton, Modal, Tag} from 'rsuite'
import {StateColor} from '../utility'

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
    image: undefined,
    socialMediaTitle: undefined,
    socialMediaDescription: undefined,
    socialMediaImage: undefined
  })

  const isNew = id === undefined
  const [blocks, setBlocks] = useState<BlockValue[]>([])

  const pageID = id || createData?.createPage.id

  const {data: pageData, refetch, loading: isLoading} = usePageQuery({
    skip: isNew || createData != null,
    errorPolicy: 'all',
    fetchPolicy: 'no-cache',
    variables: {id: pageID!}
  })

  const {t} = useTranslation()

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
      const {
        slug,
        title,
        description,
        tags,
        image,
        blocks,
        properties,
        socialMediaTitle,
        socialMediaDescription,
        socialMediaImage
      } = latest
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
        image: image || undefined,
        socialMediaTitle: socialMediaTitle || '',
        socialMediaDescription: socialMediaDescription || '',
        socialMediaImage: socialMediaImage || undefined
      })

      setBlocks(blocks.map(blockForQueryBlock))
    }
  }, [pageData])

  const [stateColor, setStateColor] = useState<StateColor>(StateColor.none)
  const [tagTitle, setTagTitle] = useState<string>('')

  useEffect(() => {
    if (pageData?.page?.pending) {
      setStateColor(StateColor.pending)
      setTagTitle(
        t('pageEditor.overview.pending', {
          date: new Date(pageData?.page?.pending?.publishAt ?? '').toDateString(),
          time: new Date(pageData?.page?.pending?.publishAt ?? '').toLocaleTimeString()
        })
      )
    } else if (pageData?.page?.published) {
      setStateColor(StateColor.published)
      setTagTitle(
        t('pageEditor.overview.published', {
          date: new Date(pageData?.page?.published?.publishedAt ?? '').toDateString(),
          time: new Date(pageData?.page?.published?.publishedAt ?? '').toLocaleTimeString()
        })
      )
    } else {
      setStateColor(StateColor.unpublished)
      setTagTitle(t('pageEditor.overview.unpublished'))
    }
  }, [pageData, hasChanged])

  useEffect(() => {
    const error = createError?.message ?? updateError?.message ?? publishError?.message
    if (error) Alert.error(error, 0)
  }, [createError, updateError, publishError])

  function createInput(): PageInput {
    return {
      slug: metadata.slug,
      title: metadata.title,
      description: metadata.description,
      imageID: metadata.image?.id,
      tags: metadata.tags,
      properties: metadata.properties,
      socialMediaTitle: metadata.socialMediaTitle || undefined,
      socialMediaDescription: metadata.socialMediaDescription || undefined,
      socialMediaImageID: metadata.socialMediaImage?.id || undefined,
      blocks: blocks.map(unionMapForBlock)
    }
  }

  async function handleSave() {
    const input = createInput()

    if (pageID) {
      await updatePage({variables: {id: pageID, input}})

      setChanged(false)
      Alert.success(t('pageEditor.overview.pageDraftSaved'), 2000)
    } else {
      const {data} = await createPage({variables: {input}})

      if (data) {
        dispatch({
          type: RouteActionType.ReplaceRoute,
          route: PageEditRoute.create({id: data?.createPage.id})
        })
      }

      setChanged(false)
      Alert.success(t('pageEditor.overview.pageDraftCreated'), 2000)
    }
    await refetch({id: pageID})
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
      await refetch({id: pageID})
    }

    setChanged(false)
    Alert.success(t('pageEditor.overview.pagePublished'), 2000)
  }

  useEffect(() => {
    if (isNotFound) {
      Alert.error(t('pageEditor.overview.pageNotFound'), 0)
    }
  }, [isNotFound])

  return (
    <>
      <fieldset style={{textAlign: 'center', borderColor: stateColor}}>
        <legend style={{width: 'auto', margin: '0px auto'}}>
          <Tag color={stateColor}>{tagTitle}</Tag>
        </legend>
        <EditorTemplate
          navigationChildren={
            <NavigationBar
              leftChildren={
                <IconButtonLink
                  style={{marginTop: '4px', marginBottom: '20px'}}
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
                <div style={{marginTop: '4px'}}>
                  <IconButton
                    icon={<Icon icon="newspaper-o" />}
                    size={'lg'}
                    disabled={isDisabled}
                    onClick={() => setMetaDrawerOpen(true)}>
                    {t('pageEditor.overview.metadata')}
                  </IconButton>

                  {isNew && createData == null ? (
                    <IconButton
                      style={{
                        marginLeft: '10px',
                        marginBottom: '20px'
                      }}
                      size={'lg'}
                      icon={<Icon icon="save" />}
                      disabled={isDisabled}
                      onClick={() => handleSave()}>
                      {t('pageEditor.overview.create')}
                    </IconButton>
                  ) : (
                    <>
                      <Badge className={hasChanged ? 'unsaved' : 'saved'}>
                        <IconButton
                          style={{
                            marginLeft: '10px'
                          }}
                          size={'lg'}
                          icon={<Icon icon="save" />}
                          disabled={isDisabled}
                          onClick={() => handleSave()}>
                          {t('pageEditor.overview.save')}
                        </IconButton>
                      </Badge>
                      <Badge
                        className={
                          pageData?.page?.draft || !pageData?.page?.published ? 'unsaved' : 'saved'
                        }>
                        <IconButton
                          style={{
                            marginLeft: '10px'
                          }}
                          size={'lg'}
                          icon={<Icon icon="cloud-upload" />}
                          disabled={isDisabled}
                          onClick={() => setPublishDialogOpen(true)}>
                          {t('pageEditor.overview.publish')}
                        </IconButton>
                      </Badge>
                    </>
                  )}
                </div>
              }
            />
          }>
          <BlockList value={blocks} onChange={handleChange} disabled={isDisabled}>
            {useBlockMap<BlockValue>(() => BlockMap, [])}
          </BlockList>
        </EditorTemplate>
      </fieldset>
      <Drawer show={isMetaDrawerOpen} size={'sm'} onHide={() => setMetaDrawerOpen(false)}>
        <PageMetadataPanel
          value={metadata}
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
