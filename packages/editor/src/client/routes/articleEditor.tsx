import React, {useState, useEffect} from 'react'
import nanoid from 'nanoid'

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
  MaterialIconCode,
  MaterialIconViewDay,
  IconColumn6,
  IconColumn1
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
  ArticleInput,
  usePublishArticleMutation
} from '../api/article'

import {
  BlockType,
  TitleBlockListValue,
  RichTextBlockListValue,
  ImageBlockListValue,
  QuoteBlockListValue,
  EmbedBlockListValue,
  blockForQueryBlock,
  unionMapForBlock,
  EmbedType,
  LinkPageBreakBlockListValue,
  ArticleTeaserGridBlock1ListValue,
  ArticleTeaserGridBlock6ListValue
} from '../api/blocks'

import {RichTextBlock, createDefaultValue} from '../blocks/richTextBlock'
import {QuoteBlock} from '../blocks/quoteBlock'
import {EmbedBlock} from '../blocks/embedBlock'
import {ImageBlock} from '../blocks/imageBlock'
import {TitleBlock} from '../blocks/titleBlock'
import {Author} from '../api/author'
import {LinkPageBreakBlock} from '../blocks/linkPageBreakBlock'
import {useUnsavedChangesDialog} from '../unsavedChangesDialog'
import {TeaserGridBlock} from '../blocks/teaserGridBlock'

// TODO: Deduplicate with `PageEditor`.
export type ArticleBlockValue =
  | TitleBlockListValue
  | RichTextBlockListValue
  | ImageBlockListValue
  | QuoteBlockListValue
  | LinkPageBreakBlockListValue
  | EmbedBlockListValue
  | ArticleTeaserGridBlock1ListValue
  | ArticleTeaserGridBlock6ListValue

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
  const [publishArticle, {loading: isPublishing, error: publishError}] = usePublishArticleMutation()

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
  const isDisabled = isLoading || isCreating || isUpdating || isPublishing || isNotFound

  const [hasChanged, setChanged] = useState(false)
  const unsavedChangesDialog = useUnsavedChangesDialog(hasChanged)

  useEffect(() => {
    if (articleData?.article) {
      const {latest, published, shared} = articleData.article
      const {slug, preTitle, title, lead, tags, breaking, authors, image, blocks} = latest
      const {publishedAt} = published ?? {}

      if (publishedAt) setPublishedAt(new Date(publishedAt))

      setMetadata({
        slug,
        preTitle: preTitle || '',
        title,
        lead,
        tags,
        shared,
        breaking,
        authors: authors.filter((author: Author | null) => author != null),
        image: image ? image : undefined
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

  // TODO: Support new API in UI
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
        <BlockList
          value={blocks}
          onChange={blocks => {
            setBlocks(blocks)
            setChanged(true)
          }}
          disabled={isLoading || isDisabled}>
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

              [BlockType.LinkPageBreak]: {
                field: props => <LinkPageBreakBlock {...props} />,
                defaultValue: {text: '', linkText: '', linkURL: ''},
                label: 'Page Break',
                icon: MaterialIconViewDay
              },

              [BlockType.Embed]: {
                field: props => <EmbedBlock {...props} />,
                defaultValue: {type: EmbedType.Other},
                label: 'Embed',
                icon: MaterialIconCode
              },

              [BlockType.ArticleTeaserGrid1]: {
                field: props => <TeaserGridBlock {...props} />,
                defaultValue: {numColumns: 1, teasers: [[nanoid(), null]]},
                label: '1 Col',
                icon: IconColumn1
              },

              [BlockType.ArticleTeaserGrid6]: {
                field: props => <TeaserGridBlock {...props} />,
                defaultValue: {
                  numColumns: 3,
                  teasers: [
                    [nanoid(), null],
                    [nanoid(), null],
                    [nanoid(), null],
                    [nanoid(), null],
                    [nanoid(), null],
                    [nanoid(), null]
                  ]
                },
                label: '6 Cols',
                icon: IconColumn6
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
