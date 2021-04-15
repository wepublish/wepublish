import React, {useState, useEffect, useCallback, useReducer} from 'react'
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
import {LanguagesConfig, usePublishContentMutation} from '../api'
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
import {GenericContentView} from '../atoms/contentEdit/GenericContentView'
import {
  ContentModelSchemaFieldBase,
  ContentModelSchemaFieldEnum,
  ContentModelSchemaFieldLeaf,
  ContentModelSchemaFieldObject,
  ContentModelSchemaFieldUnion,
  ContentModelSchemaTypes
} from '../interfaces/contentModelSchema'
import update, {CustomCommands} from 'immutability-helper'
import {SchemaPath} from '../interfaces/utilTypes'

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

export enum ContentEditActionEnum {
  setInitialState = 'setInitialState',
  update = 'update',
  splice = 'splice',
  push = 'push'
}
export type ContentEditAction =
  | ContentEditActionInitial
  | ContentEditActionUpdate
  | ContentEditActionSplice
  | ContentEditActionPush

export interface ContentEditActionBase {
  type: ContentEditActionEnum
}

export interface ContentEditActionInitial extends ContentEditActionBase {
  type: ContentEditActionEnum
  value: unknown
}

export interface ContentEditActionUpdate extends ContentEditActionBase {
  type: ContentEditActionEnum.update
  schemaPath: SchemaPath
  value: unknown
}

export interface ContentEditActionSplice extends ContentEditActionBase {
  type: ContentEditActionEnum.splice
  schemaPath: SchemaPath
  start: number
  delete: number
  insert: any[]
}

export interface ContentEditActionPush extends ContentEditActionBase {
  type: ContentEditActionEnum.push
  schemaPath: SchemaPath
  insert: any[]
}

function reducer(state: any, action: ContentEditAction) {
  switch (action.type) {
    case ContentEditActionEnum.setInitialState:
      const actionInitial = action as ContentEditActionInitial
      return actionInitial.value

    case ContentEditActionEnum.update:
      const actionUpdate = action as ContentEditActionUpdate
      let updateOperation: CustomCommands<any> = {$set: actionUpdate.value}
      updateOperation = actionUpdate.schemaPath.reverse().reduce((accu, item) => {
        return {[item]: accu}
      }, updateOperation)
      return update(state, updateOperation)

    case ContentEditActionEnum.splice:
      const actionSplice = action as ContentEditActionSplice
      let spliceOperation: CustomCommands<any> = {
        $splice: [[actionSplice.start, actionSplice.delete, ...actionSplice.insert]]
      }
      spliceOperation = actionSplice.schemaPath.reverse().reduce((accu, item) => {
        return {[item]: accu}
      }, spliceOperation)
      return update(state, spliceOperation)

    case ContentEditActionEnum.push:
      const actionPush = action as ContentEditActionPush
      let pushOperation: CustomCommands<any> = {
        $push: actionPush.insert
      }
      pushOperation = actionPush.schemaPath.reverse().reduce((accu, item) => {
        return {[item]: accu}
      }, pushOperation)
      return update(state, pushOperation)

    default:
      throw new Error()
  }
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
  function setContentData(value: unknown) {
    dispatcher({
      type: ContentEditActionEnum.setInitialState,
      value
    })
  }

  const intitialContent =
    contentConfig.defaultContent ??
    generateEmptyRootContent(contentConfig.schema.content, editorConfig.lang)
  const [contentData, dispatcher] = useReducer(reducer, intitialContent)

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
    const {__typename, ...content} = contentData

    let meta
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
  } else {
    content = (
      <GenericContentView
        record={contentData}
        model={contentConfig.schema.content}
        dispatch={dispatcher}></GenericContentView>
    )
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

export function generateEmptyRootContent(schema: any, lang: LanguagesConfig): unknown {
  return generateEmptyContent(
    {
      type: ContentModelSchemaTypes.object,
      fields: schema
    } as any,
    lang
  )
}

export function generateEmptyContent(
  field: ContentModelSchemaFieldBase,
  lang?: LanguagesConfig
): unknown {
  function defaultVal(defaultVal: unknown) {
    if ((field as ContentModelSchemaFieldLeaf).i18n) {
      return lang?.languages.reduce((accu, lang) => {
        accu[lang.tag] = defaultVal
        return accu
      }, {} as any)
    }
    return defaultVal
  }

  if (!field) {
    return undefined
  }
  if (field.type === ContentModelSchemaTypes.object) {
    const schema = field as ContentModelSchemaFieldObject
    const r: {[key: string]: unknown} = {}
    return Object.entries(schema.fields).reduce((accu, item) => {
      const [key, val] = item
      accu[key] = generateEmptyContent(val, lang)
      return accu
    }, r)
  }
  if (field.type === ContentModelSchemaTypes.string) {
    return defaultVal('')
  }
  if (field.type === ContentModelSchemaTypes.richText) {
    return defaultVal([
      {
        type: 'paragraph',
        children: [
          {
            text: ''
          }
        ]
      }
    ])
  }
  if (field.type === ContentModelSchemaTypes.enum) {
    const schema = field as ContentModelSchemaFieldEnum
    return defaultVal(schema.values[0].value)
  }
  if (field.type === ContentModelSchemaTypes.int) {
    return defaultVal(0)
  }
  if (field.type === ContentModelSchemaTypes.float) {
    return defaultVal(0)
  }
  if (field.type === ContentModelSchemaTypes.boolean) {
    return defaultVal(true)
  }
  if (field.type === ContentModelSchemaTypes.list) {
    return []
  }
  if (field.type === ContentModelSchemaTypes.reference) {
    return defaultVal(null)
  }
  if (field.type === ContentModelSchemaTypes.union) {
    const schema = field as ContentModelSchemaFieldUnion
    const [key, val] = Object.entries(schema.cases)[0]
    return {[key]: generateEmptyContent(val, lang)}
  }

  return {}
}
