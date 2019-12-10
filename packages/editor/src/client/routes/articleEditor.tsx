import React, {useState, useEffect} from 'react'
import nanoid from 'nanoid'

import {
  EditorTemplate,
  NavigationBar,
  NavigationButton,
  BlockListValue,
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

import {RichTextBlock, RichTextValue, createDefaultValue} from '../blocks/richTextBlock'
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

import {BlockType, VersionState} from '../api/types'
import {QuoteBlockValue, QuoteBlock} from '../blocks/quoteBlock'
import {EmbedBlockValue, EmbedBlock, EmbedType} from '../blocks/embedBlock'

export type RichTextBlockListValue = BlockListValue<BlockType.RichText, RichTextValue>
export type ImageBlockListValue = BlockListValue<BlockType.Image, ImageBlockValue>
export type TitleBlockListValue = BlockListValue<BlockType.Title, TitleBlockValue>
export type QuoteBlockListValue = BlockListValue<BlockType.Quote, QuoteBlockValue>
export type EmbedBlockListValue = BlockListValue<BlockType.Embed, EmbedBlockValue>

export type BlockValue =
  | TitleBlockListValue
  | RichTextBlockListValue
  | ImageBlockListValue
  | QuoteBlockListValue
  | EmbedBlockListValue

export interface ArticleEditorProps {
  readonly id?: string
}

const InitialArticleBlocks: BlockValue[] = [
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
  const [blocks, setBlocks] = useState<BlockValue[]>(isNew ? InitialArticleBlocks : [])

  const articleID = id || createData?.createArticle.id

  const {data: articleData, loading: isArticleLoading} = useGetArticleQuery({
    skip: isNew || createData != null,
    fetchPolicy: 'no-cache',
    variables: {id: articleID!}
  })

  const isDisabled =
    isArticleLoading || isCreating || isUpdating || (articleData && !articleData.article)

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
      authorIDs: [], // TODO
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
    if (articleData && !articleData.article) {
      setErrorMessage('Article Not Found')
      setErrorToastOpen(true)
    }
  }, [articleData])

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
        <BlockList value={blocks} onChange={setBlocks} disabled={isArticleLoading || isDisabled}>
          {useBlockMap<BlockValue>(
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
        [BlockType.Title]: {
          title: block.value.title || undefined,
          lead: block.value.lead || undefined
        }
      }

    case BlockType.RichText:
      return {
        [BlockType.RichText]: {richText: block.value.value}
      }

    case BlockType.Quote:
      return {
        [BlockType.Quote]: {
          quote: block.value.quote || undefined,
          author: block.value.author || undefined
        }
      }

    case BlockType.Embed: {
      const {value} = block

      switch (value.type) {
        case EmbedType.FacebookPost:
          return {
            [EmbedType.FacebookPost]: {
              userID: value.userID,
              postID: value.postID
            }
          }

        case EmbedType.InstagramPost:
          return {
            [EmbedType.InstagramPost]: {
              postID: value.postID
            }
          }

        case EmbedType.TwitterTweet:
          return {
            [EmbedType.TwitterTweet]: {
              userID: value.userID,
              tweetID: value.tweetID
            }
          }

        case EmbedType.VimeoVideo:
          return {
            [EmbedType.VimeoVideo]: {
              videoID: value.videoID
            }
          }

        case EmbedType.YouTubeVideo:
          return {
            [EmbedType.YouTubeVideo]: {
              videoID: value.videoID
            }
          }

        case EmbedType.SoundCloudTrack:
          return {
            [EmbedType.SoundCloudTrack]: {
              trackID: value.trackID
            }
          }

        case EmbedType.Other:
          return {
            [BlockType.Embed]: {
              title: value.title,
              url: value.url,
              width: value.width,
              height: value.height
            }
          }
      }
    }
  }
}

function blockForQueryBlock(block: any): BlockValue | null {
  const type: string = block.__typename
  const key: string = nanoid()

  switch (type) {
    case 'ImageBlock':
      return {
        key,
        type: BlockType.Image,
        value: {
          caption: block.caption ?? '',
          image: block.image ? block.image : null
        }
      }

    case 'TitleBlock':
      return {
        key,
        type: BlockType.Title,
        value: {
          title: block.title ?? '',
          lead: block.lead ?? ''
        }
      }

    case 'RichTextBlock':
      return {
        key,
        type: BlockType.RichText,
        value: {value: block.richText, selection: null}
      }

    case 'QuoteBlock':
      return {
        key,
        type: BlockType.Quote,
        value: {quote: block.quote ?? '', author: block.author ?? ''}
      }

    case 'FacebookPostBlock':
      return {
        key,
        type: BlockType.Embed,
        value: {type: EmbedType.FacebookPost, userID: block.userID, postID: block.postID}
      }

    case 'InstagramPostBlock':
      return {
        key,
        type: BlockType.Embed,
        value: {type: EmbedType.InstagramPost, postID: block.postID}
      }

    case 'TwitterTweetBlock':
      return {
        key,
        type: BlockType.Embed,
        value: {type: EmbedType.TwitterTweet, userID: block.userID, tweetID: block.tweetID}
      }

    case 'VimeoVideoBlock':
      return {
        key,
        type: BlockType.Embed,
        value: {type: EmbedType.VimeoVideo, videoID: block.videoID}
      }

    case 'YouTubeVideoBlock':
      return {
        key,
        type: BlockType.Embed,
        value: {type: EmbedType.YouTubeVideo, videoID: block.videoID}
      }

    case 'SoundCloudTrackBlock':
      return {
        key,
        type: BlockType.Embed,
        value: {type: EmbedType.SoundCloudTrack, trackID: block.trackID}
      }

    case 'EmbedBlock':
      return {
        key,
        type: BlockType.Embed,
        value: {
          type: EmbedType.Other,
          url: block.url,
          title: block.title,
          width: block.width,
          height: block.height
        }
      }

    default:
      throw new Error('Invalid Block')
  }
}
