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
  MaterialIconTextFormat,
  MaterialIconInsertDriveFileOutlined,
  MaterialIconPublishOutlined,
  MaterialIconSaveOutlined,
  MaterialIconImage,
  MaterialIconTitle,
  MaterialIconFormatQuote,
  MaterialIconCode
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
  useGetArticleQuery,
  useUpdateArticleMutation,
  ArticleInput
} from '../api/article'

import {VersionState} from '../api/common'

import {
  BlockType,
  TitleBlockListValue,
  RichTextBlockListValue,
  ImageBlockListValue,
  QuoteBlockListValue,
  EmbedBlockListValue,
  blockForQueryBlock,
  unionMapForBlock,
  EmbedType
} from '../api/blocks'

import {RichTextBlock, createDefaultValue} from '../blocks/richTextBlock'
import {QuoteBlock} from '../blocks/quoteBlock'
import {EmbedBlock} from '../blocks/embedBlock'
import {ImageBlock} from '../blocks/imageBlock'
import {TitleBlock} from '../blocks/titleBlock'

export type ArticleBlockValue =
  | TitleBlockListValue
  | RichTextBlockListValue
  | ImageBlockListValue
  | QuoteBlockListValue
  | EmbedBlockListValue

export interface ArticleEditorProps {
  readonly id?: string
}

const InitialArticleBlocks: ArticleBlockValue[] = [
  {key: '0', type: BlockType.Title, value: {title: '', lead: ''}},
  {key: '1', type: BlockType.Image, value: {image: null, caption: ''}}
]

export function ArticleEditor({id}: ArticleEditorProps) {
  const dispatch = useRouteDispatch()

  const [
    createArticle,
    {loading: isCreating, data: createData, error: createError}
  ] = useCreateArticleMutation()

  const [updateArticle, {loading: isUpdating, error: updateError}] = useUpdateArticleMutation()

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
    image: undefined
  })

  const isNew = id == undefined
  const [blocks, setBlocks] = useState<ArticleBlockValue[]>(isNew ? InitialArticleBlocks : [])

  const articleID = id || createData?.createArticle.id

  const {data: articleData, loading: isLoading} = useGetArticleQuery({
    skip: isNew || createData != null,
    fetchPolicy: 'no-cache',
    variables: {id: articleID!}
  })

  const isNotFound = articleData && !articleData.article
  const isDisabled = isLoading || isCreating || isUpdating || isNotFound

  useEffect(() => {
    if (articleData?.article) {
      const {latest} = articleData.article
      const {slug, preTitle, title, lead, tags, shared, breaking, authors, image, blocks} = latest

      setMetadata({
        slug,
        preTitle: preTitle || '',
        title,
        lead,
        tags,
        shared,
        breaking,
        authors,
        image: image ? image : undefined
      })

      setBlocks(blocks.map(blockForQueryBlock))
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
      authorIDs: metadata.authors.map(({id}) => id),
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
        <BlockList value={blocks} onChange={setBlocks} disabled={isLoading || isDisabled}>
          {useBlockMap<ArticleBlockValue>(
            () => ({
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
              },

              [BlockType.Quote]: {
                field: props => <QuoteBlock {...props} />,
                defaultValue: {quote: '', author: ''},
                label: 'Quote',
                icon: MaterialIconFormatQuote
              },

              [BlockType.Embed]: {
                field: props => <EmbedBlock {...props} />,
                defaultValue: {type: EmbedType.Other},
                label: 'Embed',
                icon: MaterialIconCode
              }
            }),
            []
          )}
        </BlockList>
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
