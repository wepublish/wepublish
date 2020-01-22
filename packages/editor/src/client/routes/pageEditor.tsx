import React, {useState, useEffect} from 'react'

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
  MaterialIconSaveOutlined,
  IconColumn6,
  IconColumn1,
  MaterialIconTitle,
  MaterialIconTextFormat,
  MaterialIconImage
} from '@karma.run/icons'

import {RouteActionType} from '@karma.run/react'

import {RouteNavigationLinkButton, useRouteDispatch, PageEditRoute, PageListRoute} from '../route'
import {TeaserGridBlock} from '../blocks/teaserGridBlock'
import {BlockType} from '../api/common'

import {
  PageInput,
  useCreatePageMutation,
  useUpdatePageMutation,
  useGetPageQuery,
  usePublishPageMutation
} from '../api/page'

import {PageMetadata, PageMetadataPanel} from '../panel/pageMetadataPanel'
import {PublishPagePanel} from '../panel/publishPagePanel'

import {
  blockForQueryBlock,
  unionMapForBlock,
  ArticleTeaserGridBlock1ListValue,
  ArticleTeaserGridBlock6ListValue,
  TitleBlockListValue,
  RichTextBlockListValue,
  ImageBlockListValue
} from '../api/blocks'

import {createDefaultValue, RichTextBlock} from '../blocks/richTextBlock'
import {TitleBlock} from '../blocks/titleBlock'
import {ImageBlock} from '../blocks/imageBlock'

export type PageBlockValue =
  | TitleBlockListValue
  | RichTextBlockListValue
  | ImageBlockListValue
  | ArticleTeaserGridBlock1ListValue
  | ArticleTeaserGridBlock6ListValue

export interface PageEditorProps {
  readonly id?: string
}

export function PageEditor({id}: PageEditorProps) {
  const dispatch = useRouteDispatch()

  const [
    createPage,
    {data: createData, loading: isCreating, error: createError}
  ] = useCreatePageMutation()

  const [updatePage, {loading: isUpdating, error: updateError}] = useUpdatePageMutation()
  const [publishPage, {loading: isPublishing, error: publishError}] = usePublishPageMutation()

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
    image: undefined
  })

  const isNew = id == undefined
  const [blocks, setBlocks] = useState<PageBlockValue[]>([])

  const pageID = id || createData?.createPage.id

  const {data: pageData, loading: isLoading} = useGetPageQuery({
    skip: isNew || createData != null,
    fetchPolicy: 'no-cache',
    variables: {id: pageID!}
  })

  const isNotFound = pageData && !pageData.page
  const isDisabled = isLoading || isCreating || isUpdating || isPublishing || isNotFound

  useEffect(() => {
    if (pageData?.page) {
      const {latest, publishedAt} = pageData.page
      const {slug, title, description, tags, image, blocks} = latest

      if (publishedAt) setPublishedAt(new Date(publishedAt))

      setMetadata({
        slug,
        title,
        description,
        tags,
        image: image ? image : null
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
      blocks: blocks.map(unionMapForBlock)
    }
  }

  async function handleSave() {
    const input = createInput()

    if (pageID) {
      await updatePage({variables: {id: pageID, input}})

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
            version: data.updatePage.latest.version,
            publishedAt: publishDate.toISOString(),
            updatedAt: updateDate.toISOString()
          }
        })

        if (publishData?.publishPage?.publishedAt) {
          setPublishedAt(new Date(publishData?.publishPage?.publishedAt))
        }
      }
    }

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
        <BlockList value={blocks} onChange={blocks => setBlocks(blocks)} disabled={isDisabled}>
          {useBlockMap<PageBlockValue>(
            () => ({
              [BlockType.ArticleTeaserGrid1]: {
                field: props => <TeaserGridBlock {...props} />,
                defaultValue: {numColumns: 1, teasers: [null]},
                label: '1 Col',
                icon: IconColumn1
              },

              [BlockType.ArticleTeaserGrid6]: {
                field: props => <TeaserGridBlock {...props} />,
                defaultValue: {numColumns: 3, teasers: [null, null, null, null, null, null]},
                label: '6 Cols',
                icon: IconColumn6
              },

              [BlockType.Title]: {
                field: props => <TitleBlock {...props} />,
                defaultValue: {title: '', lead: ''},
                label: 'Title',
                icon: MaterialIconTitle
              },

              [BlockType.RichText]: {
                field: props => <RichTextBlock {...props} />,
                defaultValue: createDefaultValue,
                label: 'Rich Text',
                icon: MaterialIconTextFormat
              },

              [BlockType.Image]: {
                field: props => <ImageBlock {...props} />,
                defaultValue: {image: null, caption: ''},
                label: 'Image',
                icon: MaterialIconImage
              }
            }),
            []
          )}
        </BlockList>
      </EditorTemplate>
      <Drawer open={isMetaDrawerOpen} width={480} onClose={() => setMetaDrawerOpen(false)}>
        {() => (
          <PageMetadataPanel
            value={metadata}
            onClose={() => setMetaDrawerOpen(false)}
            onChange={value => setMetadata(value)}
          />
        )}
      </Drawer>
      <Dialog open={isPublishDialogOpen} width={480} onClose={() => setPublishDialogOpen(false)}>
        {() => (
          <PublishPagePanel
            initialPublishDate={publishedAt}
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
