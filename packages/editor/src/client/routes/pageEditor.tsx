import React, {useState, useEffect} from 'react'

import {
  EditorTemplate,
  NavigationBar,
  NavigationButton,
  BlockListValue,
  BlockList,
  Drawer,
  Toast,
  Dialog
} from '@karma.run/ui'

import {
  MaterialIconArrowBack,
  MaterialIconInsertDriveFileOutlined,
  MaterialIconPublishOutlined,
  MaterialIconSaveOutlined,
  IconColumn6,
  IconColumn1
} from '@karma.run/icons'

import {RouteNavigationLinkButton, useRouteDispatch, PageEditRoute, PageListRoute} from '../route'

import {RouteActionType} from '@karma.run/react'
import {TeaserGridBlockValue, TeaserGridBlock} from '../blocks/teaserGridBlock'
import {BlockType, VersionState} from '../api/types'

import {
  PageInput,
  useCreatePageMutation,
  useUpdatePageMutation,
  useGetPageQuery,
  PageBlockUnionMap
} from '../api/page'

import {PageMetadata, PageMetadataPanel} from '../panel/pageMetadataPanel'
import {PublishPagePanel} from '../panel/publishPagePanel'

export type ArticleTeaserGridBlock1ListValue = BlockListValue<
  BlockType.ArticleTeaserGrid1,
  TeaserGridBlockValue
>

export type ArticleTeaserGridBlock3ListValue = BlockListValue<
  BlockType.ArticleTeaserGrid6,
  TeaserGridBlockValue
>

export type PageBlockValue = ArticleTeaserGridBlock1ListValue | ArticleTeaserGridBlock3ListValue

export interface PageEditorProps {
  readonly id?: string
}

export function PageEditor({id}: PageEditorProps) {
  const dispatch = useRouteDispatch()

  const [createPage, {data: createData, error: createError}] = useCreatePageMutation()
  const [updatePage, {error: updateError}] = useUpdatePageMutation()

  const [isMetaDrawerOpen, setMetaDrawerOpen] = useState(false)
  const [isPublishDialogOpen, setPublishDialogOpen] = useState(false)

  const [isSuccessToastOpen, setSuccessToastOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [isErrorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [metadata, setMetadata] = useState<PageMetadata>({
    slug: '',
    title: '',
    description: '',
    tags: [],
    image: null
  })

  const [blocks, setBlocks] = useState<PageBlockValue[]>([])
  const [isNew] = useState(id == undefined)

  const pageID = id || createData?.createPage.id

  const {data: pageData, loading: isPageLoading} = useGetPageQuery({
    skip: isNew || createData != null,
    fetchPolicy: 'no-cache',
    variables: {
      id: pageID!,
      metaImageTransformation: {height: 200},
      blockImageTransformation: {height: 300}
    }
  })

  const isDisabled = isPageLoading

  useEffect(() => {
    if (pageData?.page) {
      const latest = pageData.page.latest
      const {slug, title, description, tags, image, blocks} = latest

      setMetadata({
        slug,
        title,
        description,
        tags,
        image: image
          ? {
              id: image.id,
              width: image.width,
              height: image.height,
              url: image.url,
              transform: image.transform
            }
          : null
      })

      setBlocks(blocks.map(blockForQueryBlock))
    }
  }, [pageData])

  useEffect(() => {
    if (createError || updateError) {
      setErrorToastOpen(true)
      setErrorMessage(updateError?.message ?? createError!.message)
    }
  }, [createError, updateError])

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
      await updatePage({variables: {id: pageID, state: VersionState.Draft, input}})

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

  async function handlePublish() {
    if (pageID) {
      await updatePage({
        variables: {id: pageID, state: VersionState.Published, input: createInput()}
      })
    }

    setSuccessToastOpen(true)
    setSuccessMessage('Page Published')
  }

  if (pageData && !pageData.page) {
    return <div>Not Found</div> // TODO
  }

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
        {isPageLoading ? null : ( // TODO: Loading indicator
          <BlockList value={blocks} onChange={blocks => setBlocks(blocks)}>
            {{
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
              }
            }}
          </BlockList>
        )}
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
            metadata={metadata}
            onClose={() => setPublishDialogOpen(false)}
            onConfirm={() => {
              handlePublish()
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

function unionMapForBlock(block: PageBlockValue): PageBlockUnionMap {
  switch (block.type) {
    case BlockType.ArticleTeaserGrid1:
    case BlockType.ArticleTeaserGrid6:
      return {
        articleTeaserGrid: {
          teasers: block.value.teasers.map(value =>
            value ? {type: value.type, articleID: value.article.id} : null
          ),
          numColumns: block.value.numColumns
        }
      }
  }
}

function blockForQueryBlock(block: any): PageBlockValue | null {
  const type: string = block.__typename
  const key: string = block.key

  switch (type) {
    case 'ArticleTeaserGridBlock':
      return {
        key,
        type: block.numColumns === 1 ? BlockType.ArticleTeaserGrid1 : BlockType.ArticleTeaserGrid6,
        value: {
          numColumns: block.numColumns,
          teasers: block.teasers.map(
            (teaser: any) =>
              teaser && {
                type: teaser.type,
                article: teaser.article && {
                  id: teaser.article.id,
                  title: teaser.article.latest.title,
                  image: teaser.article.latest.image && {
                    id: teaser.article.latest.image.id,
                    width: teaser.article.latest.image.width,
                    height: teaser.article.latest.image.height,
                    url: teaser.article.latest.image.transform[0]
                  }
                }
              }
          )
        }
      }

    default:
      return null // TODO: Throw error
  }
}
