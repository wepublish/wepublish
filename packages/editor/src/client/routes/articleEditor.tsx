import React, {useState, useEffect} from 'react'
import {Value, Block, Document} from 'slate'

import {
  EditorTemplate,
  NavigationBar,
  NavigationButton,
  BlockListValue,
  BlockList,
  Drawer
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
import {useArticleCreateMutation, useGetArticleQuery} from '../api/article'
import {ArticleVersionState} from '../api/types'
import {RouteActionType} from '@karma.run/react'

export type RichTextBlockListValue = BlockListValue<'richText', Value>
export type TitleBlockListValue = BlockListValue<'title', TitleBlockValue>
export type ImageBlockListValue = BlockListValue<'image', ImageBlockValue>
export type BlockValue = TitleBlockListValue | RichTextBlockListValue | ImageBlockListValue

export interface ArticleEditorProps {
  readonly id?: string
}

export function ArticleEditor({id}: ArticleEditorProps) {
  const dispatch = useRouteDispatch()

  const [createArticle, {data: createData}] = useArticleCreateMutation()
  const [isMetaDrawerOpen, setMetaDrawerOpen] = useState(false)

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
    skip: isNew,
    variables: {id: articleID!}
  })

  const isDisabled = isArticleLoading

  useEffect(() => {
    if (articleData) {
      // setMetadata()
    }
  }, [articleData])

  useEffect(() => {
    if (createData) {
      dispatch({
        type: RouteActionType.ReplaceRoute,
        route: ArticleEditRoute.create({id: createData?.createArticle.id})
      })
    }
  }, [createData])

  async function handleSave() {
    if (articleID) {
      // TODO: Update
    } else {
      createArticle({
        variables: {
          input: {
            slug: metadata.slug,
            preTitle: metadata.preTitle || undefined,
            title: metadata.title,
            lead: metadata.lead,
            authorIDs: metadata.authors,
            imageID: metadata.image?.id,
            breaking: metadata.breaking,
            shared: metadata.shared,
            tags: metadata.tags,
            blocks: []
          }
        }
      })
    }
  }

  function handlePublish() {}

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

                <NavigationButton
                  icon={MaterialIconSaveOutlined}
                  label="Save"
                  onClick={() => handleSave()}
                  disabled={isDisabled}
                />

                <NavigationButton
                  icon={MaterialIconPublishOutlined}
                  label="Publish"
                  disabled={isDisabled}
                />
              </>
            }
          />
        }>
        {isArticleLoading ? (
          <div>Loading...</div> // TODO: Loading indicator
        ) : (
          <BlockList value={blocks} onChange={blocks => setBlocks(blocks)} allowInit>
            {{
              title: {
                field: props => <TitleBlock {...props} />,
                defaultValue: {title: '', lead: ''},
                label: 'Title',
                icon: MaterialIconTitle
              },

              richText: {
                field: props => <RichTextBlock {...props} />,
                defaultValue: Value.create({document: Document.create([Block.create('')])}),
                label: 'Rich Text',
                icon: MaterialIconTextFormat
              },

              image: {
                field: props => <ImageBlock {...props} />,
                defaultValue: {image: null, caption: ''},
                label: 'Image',
                icon: MaterialIconImage
              }
            }}
          </BlockList>
        )}
      </EditorTemplate>
      <Drawer open={isMetaDrawerOpen} width={480} closeOnBackgroundClick>
        {() => (
          <ArticleMetadataPanel
            value={metadata}
            onClose={() => setMetaDrawerOpen(false)}
            onChange={value => setMetadata(value)}
          />
        )}
      </Drawer>
    </>
  )
}
