import React, {useState, useEffect, useCallback} from 'react'
import {Modal, Notification, Icon, IconButton} from 'rsuite'
import {EditorTemplate} from '../atoms/editorTemplate'
import {NavigationBar} from '../atoms/navigationBar'
import {RouteActionType} from '@karma.run/react'

import {
  useRouteDispatch,
  IconButtonLink,
  ContentListRoute,
  useRoute,
  ContentEditRoute
} from '../route'

import {ContentMetadataPanel, DefaultMetadata} from '../panel/contentMetadataPanel'
import {usePublishContentMutation} from '../api'
import {useUnsavedChangesDialog} from '../unsavedChangesDialog'
import {useTranslation} from 'react-i18next'
import {PublishCustomContentPanel} from '../panel/contentPublishPanel'
import {useMutation, useQuery} from '@apollo/client'
import {
  getCreateMutation,
  getUpdateMutation,
  getReadQuery,
  stripTypename
} from '../utils/queryUtils'
import {EditorConfig} from '../interfaces/extensionConfig'
import {ContentMetadataPanelModal} from '../panel/contentMetadataPanelModal'

export interface ArticleEditorProps {
  readonly id?: string
  readonly editorConfig: EditorConfig
}

interface ContentBody {
  id: string
  createdAt: Date
  modifiedAt: Date
  publicationDate?: Date
  dePublicationDate?: Date
  revision: number
  shared: boolean
  state: string
  title: string
  content: any
  meta?: any
  __typename: string
}

export function ContentEditor({id, editorConfig}: ArticleEditorProps) {
  const {t} = useTranslation()
  const {current} = useRoute()
  const dispatch = useRouteDispatch()
  const type = (current?.params as any).type || ''

  const contentConfig = editorConfig.contentModelExtension.find(config => {
    return config.identifier === type
  })
  if (!contentConfig) {
    throw Error(`Content type ${type} not supported`)
  }

  const [createContent, {loading: isCreating, data: createData, error: createError}] = useMutation(
    getCreateMutation(editorConfig, contentConfig)
  )

  const [updateContent, {loading: isUpdating, error: updateError}] = useMutation(
    getUpdateMutation(editorConfig, contentConfig)
  )

  const [publishContent, {loading: isPublishing, error: publishError}] = usePublishContentMutation({
    fetchPolicy: 'no-cache'
  })

  const [isMetaVisible, setMetaVisible] = useState(false)
  const [isPublishDialogOpen, setPublishDialogOpen] = useState(false)

  const [publishedAt, setPublishedAt] = useState<Date>()
  const [metadata, setMetadata] = useState<DefaultMetadata>({
    title: '',
    shared: false
  })
  const [customMetadata, setCustomMetadata] = useState<any>(contentConfig.defaultMeta ?? undefined)

  const isNew = id === undefined
  const [contentData, setContentData] = useState<any>(contentConfig.defaultContent ?? null)
  const contentdId = id || createData?.content[type].create.id

  const {data, loading: isLoading} = useQuery(getReadQuery(editorConfig, contentConfig), {
    skip: isNew || createData != null,
    errorPolicy: 'all',
    fetchPolicy: 'no-cache',
    variables: {id: contentdId!}
  })

  const isNotFound = data && !data.content
  const recordData: ContentBody = data?.content[type]?.read

  const isDisabled = isLoading || isCreating || isUpdating || isPublishing || isNotFound
  const pendingPublishDate = recordData?.createdAt

  const [hasChanged, setChanged] = useState(false)
  const unsavedChangesDialog = useUnsavedChangesDialog(hasChanged)

  const handleChange = useCallback(
    (contentData: React.SetStateAction<any>) => {
      setContentData(contentData)
      setChanged(true)
    },
    [id]
  )

  useEffect(() => {
    if (recordData) {
      const {shared, title, content, meta} = stripTypename(recordData)
      const publishedAt = new Date()
      if (publishedAt) setPublishedAt(new Date(publishedAt))

      setMetadata({
        title,
        shared
      })
      setCustomMetadata(meta)
      setContentData(content)
    }
  }, [recordData])

  useEffect(() => {
    if (createError || updateError || publishError) {
      Notification.error({
        title: updateError?.message ?? createError?.message ?? publishError!.message,
        duration: 5000
      })
    }
  }, [createError, updateError, publishError])

  function createInput(): any {
    let {__typename, ...content} = contentData

    let meta = undefined
    if (customMetadata) {
      const {__typename: waste, ...rest} = customMetadata
      meta = rest
    }

    return {
      id: contentdId,
      title: metadata.title,
      shared: metadata.shared,
      content,
      meta
    }
  }

  async function handleSave() {
    const input = createInput()
    if (contentdId) {
      await updateContent({variables: {input}})

      setChanged(false)
      Notification.success({
        title: t('articleEditor.overview.draftSaved'),
        duration: 2000
      })
    } else {
      const {data} = await createContent({variables: {input}})

      if (data) {
        dispatch({
          type: RouteActionType.ReplaceRoute,
          route: ContentEditRoute.create({type, id: data.content[type].create.id})
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
    if (contentdId) {
      const {data} = await updateContent({
        variables: {id: contentdId, input: createInput()}
      })

      if (data) {
        const {data: publishData} = await publishContent({
          variables: {
            id: contentdId,
            publishAt: publishDate.toISOString(),
            publishedAt: publishDate.toISOString(),
            updatedAt: updateDate.toISOString()
          }
        })

        if (publishData?.content?._all?.publish?.published?.publishedAt) {
          setPublishedAt(new Date(publishData?.content?._all?.publish?.published.publishedAt))
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

  let content = null
  if (contentConfig.getContentView) {
    content = contentConfig.getContentView(contentData, handleChange, isLoading || isDisabled)
  }

  let metadataView = null
  if (contentConfig.getMetaView) {
    metadataView = contentConfig.getMetaView(
      metadata,
      customMetadata,
      value => {
        setMetadata(value)
        setChanged(true)
      },
      (value: any) => {
        setCustomMetadata(value)
        setChanged(true)
      }
    )
  } else {
    metadataView = (
      <ContentMetadataPanel
        defaultMetadata={metadata}
        onChangeDefaultMetadata={(value: any) => {
          setMetadata(value)
          setChanged(true)
        }}
      />
    )
  }

  return (
    <>
      <EditorTemplate
        navigationChildren={
          <NavigationBar
            leftChildren={
              <IconButtonLink
                size={'lg'}
                appearance="subtle"
                icon={<Icon icon="angle-left" />}
                route={ContentListRoute.create({type})}
                onClick={e => {
                  if (!unsavedChangesDialog()) e.preventDefault()
                }}>
                {t('articleEditor.overview.back')}
              </IconButtonLink>
            }
            centerChildren={
              <>
                {metadataView ? (
                  <IconButton
                    icon={<Icon icon="newspaper-o" />}
                    appearance="subtle"
                    size={'lg'}
                    disabled={isDisabled}
                    onClick={() => setMetaVisible(true)}>
                    {t('articleEditor.overview.metadata')}
                  </IconButton>
                ) : null}

                {isNew && createData == null ? (
                  <IconButton
                    style={{
                      marginLeft: '20px'
                    }}
                    appearance="subtle"
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
                        marginLeft: '20px'
                      }}
                      appearance="subtle"
                      size={'lg'}
                      icon={<Icon icon="save" />}
                      disabled={isDisabled}
                      onClick={() => handleSave()}>
                      {t('articleEditor.overview.save')}
                    </IconButton>
                    <IconButton
                      style={{
                        marginLeft: '20px'
                      }}
                      appearance="subtle"
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
        {content}
      </EditorTemplate>

      <Modal show={isMetaVisible} full backdrop="static" onHide={() => setMetaVisible(false)}>
        <ContentMetadataPanelModal onClose={() => setMetaVisible(false)}>
          {metadataView}
        </ContentMetadataPanelModal>
      </Modal>

      <Modal show={isPublishDialogOpen} size={'sm'} onHide={() => setPublishDialogOpen(false)}>
        <PublishCustomContentPanel
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
