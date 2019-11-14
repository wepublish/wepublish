import React, {useState, useEffect} from 'react'
import {Value, Block, Document} from 'slate'

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
  MaterialIconTextFormat,
  MaterialIconInsertDriveFileOutlined,
  MaterialIconPublishOutlined,
  MaterialIconSaveOutlined,
  MaterialIconImage,
  MaterialIconTitle
} from '@karma.run/icons'

import {
  RouteNavigationLinkButton,
  ArticleListRoute,
  useRouteDispatch,
  ArticleEditRoute
} from '../route'

import {RichTextBlock} from '../blocks/richTextBlock'
import {ImageBlock, ImageBlockValue} from '../blocks/imageBlock'
import {TitleBlockValue, TitleBlock} from '../blocks/titleBlock'
import {ArticleMetadataPanel, ArticleMetadata} from '../panel/articleMetadataPanel'
import {PublishArticlePanel} from '../panel/publishArticlePanel'

import {
  useCreateArticleMutation,
  useGetArticleQuery,
  ArticleBlockUnionMap,
  useUpdateArticleMutation,
  ArticleInput
} from '../api/article'

import {RouteActionType} from '@karma.run/react'
import {BlockType, VersionState} from '../api/types'

export type RichTextBlockListValue = BlockListValue<BlockType.RichText, Value>
export type TitleBlockListValue = BlockListValue<BlockType.Title, TitleBlockValue>
export type ImageBlockListValue = BlockListValue<BlockType.Image, ImageBlockValue>
export type BlockValue = TitleBlockListValue | RichTextBlockListValue | ImageBlockListValue

export interface ArticleEditorProps {
  readonly id?: string
}

export function ArticleEditor({id}: ArticleEditorProps) {
  const dispatch = useRouteDispatch()

  const [createArticle, {data: createData, error: createError}] = useCreateArticleMutation()
  const [updateArticle, {error: updateError}] = useUpdateArticleMutation()

  const [isMetaDrawerOpen, setMetaDrawerOpen] = useState(false)
  const [isPublishDialogOpen, setPublishDialogOpen] = useState(false)

  const [isSuccessToastOpen, setSuccessToastOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [isErrorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [metadata, setMetadata] = useState<ArticleMetadata>({
    slug: '',
    preTitle: '',
    title: '',
    lead: '',
    authors: [],
    tags: [],
    shared: false,
    breaking: false,
    image: null
  })

  const [blocks, setBlocks] = useState<BlockValue[]>([])
  const [isNew] = useState(id == undefined)

  const articleID = id || createData?.createArticle.id

  const {data: articleData, loading: isArticleLoading} = useGetArticleQuery({
    skip: isNew || createData != null,
    fetchPolicy: 'no-cache',
    variables: {
      id: articleID!,
      metaImageTransformation: {height: 200},
      blockImageTransformation: {height: 300}
    }
  })

  const isDisabled = isArticleLoading

  useEffect(() => {
    if (articleData && articleData.article) {
      const articleVersion = articleData.article.latest
      const image = articleVersion.image

      setMetadata({
        slug: articleVersion.slug ?? '',
        preTitle: articleVersion.preTitle || '',
        title: articleVersion.title,
        lead: articleVersion.lead,
        tags: articleVersion.tags,
        shared: articleVersion.shared,
        breaking: articleVersion.breaking,
        authors: articleVersion.authors,
        image: image
          ? {id: image.id, width: image.width, height: image.height, url: image.transform[0]}
          : null
      })

      setBlocks(articleVersion.blocks.map(blockForQueryBlock).filter((block: any) => block != null))
    }
  }, [articleData])

  useEffect(() => {
    if (createError || updateError) {
      setErrorToastOpen(true)
      setErrorMessage(updateError?.message ?? createError!.message)
    }
  }, [createError, updateError])

  function createInput(): ArticleInput {
    return {
      slug: metadata.slug,
      preTitle: metadata.preTitle || undefined,
      title: metadata.title,
      lead: metadata.lead,
      authorIDs: metadata.authors,
      imageID: metadata.image?.id,
      breaking: metadata.breaking,
      shared: metadata.shared,
      tags: metadata.tags,
      blocks: blocks.map(unionMapForBlock)
    }
  }

  async function handleSave() {
    const input = createInput()

    if (articleID) {
      await updateArticle({variables: {id: articleID, state: VersionState.Draft, input}})

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

      setSuccessToastOpen(true)
      setSuccessMessage('Article Draft Created')
    }
  }

  async function handlePublish() {
    if (articleID) {
      await updateArticle({
        variables: {id: articleID, state: VersionState.Published, input: createInput()}
      })
    }

    setSuccessToastOpen(true)
    setSuccessMessage('Article Published')
  }

  if (articleData && !articleData.article) {
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
                route={ArticleListRoute.create({})}
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
        {isArticleLoading ? null : ( // TODO: Loading indicator
          <BlockList value={blocks} onChange={blocks => setBlocks(blocks)}>
            {{
              [BlockType.Title]: {
                field: props => <TitleBlock {...props} />,
                defaultValue: {title: '', lead: ''},
                label: 'Title',
                icon: MaterialIconTitle
              },

              [BlockType.RichText]: {
                field: props => <RichTextBlock {...props} />,
                defaultValue: Value.create({document: Document.create([Block.create('')])}),
                label: 'Rich Text',
                icon: MaterialIconTextFormat
              },

              [BlockType.Image]: {
                field: props => <ImageBlock {...props} />,
                defaultValue: {image: null, caption: ''},
                label: 'Image',
                icon: MaterialIconImage
              }
            }}
          </BlockList>
        )}
      </EditorTemplate>
      <Drawer open={isMetaDrawerOpen} width={480} onClose={() => setMetaDrawerOpen(false)}>
        {() => (
          <ArticleMetadataPanel
            value={metadata}
            onClose={() => setMetaDrawerOpen(false)}
            onChange={value => setMetadata(value)}
          />
        )}
      </Drawer>
      <Dialog open={isPublishDialogOpen} width={480} onClose={() => setPublishDialogOpen(false)}>
        {() => (
          <PublishArticlePanel
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

function unionMapForBlock(block: BlockValue): ArticleBlockUnionMap {
  switch (block.type) {
    case BlockType.Image:
      return {
        [BlockType.Image]: {
          imageID: block.value.image?.id,
          caption: block.value.caption || undefined
        }
      }

    case BlockType.Title:
      return {
        [BlockType.Title]: {title: block.value.title, lead: block.value.lead}
      }

    case BlockType.RichText:
      return {
        [BlockType.RichText]: {richText: block.value.document.toJSON()}
      }
  }
}

function blockForQueryBlock(block: any): BlockValue | null {
  const type: string = block.__typename
  const key: string = block.key

  switch (type) {
    case 'ImageBlock':
      return {
        key,
        type: BlockType.Image,
        value: {
          caption: block.caption ?? '',
          image: block.image
            ? {
                id: block.image.id,
                width: block.image.width,
                height: block.image.height,
                url: block.image.transform[0]
              }
            : null
        }
      }

    case 'TitleBlock':
      return {
        key,
        type: BlockType.Title,
        value: {
          title: block.title,
          lead: block.lead ?? ''
        }
      }

    case 'RichTextBlock':
      return {
        key,
        type: BlockType.RichText,
        value: Value.create({document: Document.fromJSON(block.richText)})
      }

    default:
      return null // TODO: Throw error
  }
}
