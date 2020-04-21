import React from 'react'

import gql from 'graphql-tag'
import {useQuery} from 'react-apollo'
import {articleAdapter} from './articleAdapter'

import {
  imageBlockDataFragment,
  richTextBlockDataFragment,
  imageGalleryBlockDataFragment,
  facebookPostBlockDataFragment,
  instagramPostBlockDataFragment,
  twitterTweetBlockDataFragment,
  vimeoVideoBlockDataFragment,
  youtubeVideoBlockDataFragment,
  soundCloudTrackBlockDataFragment,
  embedBlockDataFragment,
  linkPageBreakBlockDataFragment,
  listicleBlockDataFragment,
  quoteBlockDataFragment,
  titleBlockDataFragment,
  articleMetaDataFragment,
  gridBlockFrontDataGQLfragment
} from './gqlFragments'

import {BlockRenderer} from '../blocks/blockRenderer'
import {ArticleFooterContainer} from './footerContainer'
import {DesktopSocialMediaButtons} from '../atoms/socialMediaButtons'
import {Loader} from '../atoms/loader'
import {NotFoundTemplate} from '../templates/notFoundTemplate'
import {Helmet} from 'react-helmet-async'
import {ArticleRoute} from './routeContext'
import {useAppContext} from '../appContext'

const ArticleQuery = gql`
  query Article($id: ID!) {
    article(id: $id) {
      ...ArticleMetaData

      blocks {
        __typename
        ...RichtTextBlockData
        ...ImageBlockData
        ...ImageGalleryBlockData
        ...FacebookPostBlockData
        ...InstagramPostBlockData
        ...TwitterTweetBlockData
        ...VimeoVideoBlockData
        ...YoutubeVideoBlockData
        ...SoundCloudTrackBlockData
        ...EmbedBlockData
        ...LinkPageBreakBlockData
        ...ListicleBlockData
        ...QuoteBlockData
        ...TitleBlockData
        ...ArticleGridBlockData
      }
    }
  }

  ${articleMetaDataFragment}
  ${richTextBlockDataFragment}
  ${imageBlockDataFragment}
  ${imageGalleryBlockDataFragment}
  ${instagramPostBlockDataFragment}
  ${facebookPostBlockDataFragment}
  ${twitterTweetBlockDataFragment}
  ${vimeoVideoBlockDataFragment}
  ${youtubeVideoBlockDataFragment}
  ${soundCloudTrackBlockDataFragment}
  ${embedBlockDataFragment}
  ${linkPageBreakBlockDataFragment}
  ${listicleBlockDataFragment}
  ${quoteBlockDataFragment}
  ${titleBlockDataFragment}
  ${gridBlockFrontDataGQLfragment}
`

export interface ArticleTemplateContainerProps {
  id: string
  slug?: string
}

export function ArticleTemplateContainer({id, slug}: ArticleTemplateContainerProps) {
  const {canonicalHost} = useAppContext()
  const {data, loading} = useQuery(ArticleQuery, {variables: {id}})

  if (loading) return <Loader text="Loading" />

  const articleData = articleAdapter(data.article)

  if (!articleData) return <NotFoundTemplate />

  const {title, lead, image, tags, authors, publishedAt, updatedAt, blocks} = articleData

  const path = ArticleRoute.reverse({id, slug})
  const canonicalURL = canonicalHost + path

  return (
    <>
      <Helmet>
        <title>{title}</title>
        {lead && <meta name="description" content={lead} />}

        {/* Podcast Verification */}
        {id == 'V2Qa0rFNcqRuPIPv' && (
          <link
            rel="alternate"
            type="application/rss+xml"
            title="Nach dem Piepston"
            href="https://piepston.podigee.io/feed/mp3"
          />
        )}

        <link rel="canonical" href={canonicalURL} />

        <meta property="og:title" content={title} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalURL} />
        {image && <meta property="og:image" content={image.ogURL} />}

        <meta property="article:published_time" content={publishedAt.toISOString()} />
        <meta property="article:modified_time" content={updatedAt.toISOString()} />

        {tags.map(tag => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}

        {/* TODO: Add OpenGraph authors as soon as author profiles are implemented */}
        {/* <meta property="article:author" content="" /> */}
      </Helmet>

      <DesktopSocialMediaButtons shareUrl={canonicalURL} />
      <BlockRenderer
        articleShareUrl={canonicalURL}
        authors={authors}
        publishedAt={publishedAt}
        updatedAt={updatedAt}
        isArticle={true}
        blocks={blocks}
      />
      <ArticleFooterContainer tags={tags} authors={authors} publishDate={publishedAt} id={id} />
    </>
  )
}
