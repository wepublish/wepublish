import React from 'react'

import {gql, useQuery} from '@apollo/client'

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
  polisConversationBlockDataFragment,
  tikTokVideoBlockDataFragment,
  bildwurfAdBlockDataFragment,
  embedBlockDataFragment,
  linkPageBreakBlockDataFragment,
  listicleBlockDataFragment,
  quoteBlockDataFragment,
  titleBlockDataFragment,
  pageMetaDataFragment,
  gridBlockFrontDataGQLfragment,
  flexGridBlockFrontDataGQLfragment
} from './gqlFragments'

import {PageTemplate} from '../templates/pageTemplate'
import {BlockRenderer} from '../blocks/blockRenderer'
import {getFrontBlocks} from './blockAdapters'
import {NotFoundTemplate} from '../templates/notFoundTemplate'
import {Loader} from '../atoms/loader'
import {useAppContext} from '../appContext'

import {Helmet} from 'react-helmet-async'
import {PageRoute} from './routeContext'

const PageQuery = gql`
  query Page($id: ID, $slug: Slug, $token: String) {
    page(id: $id, slug: $slug, token: $token) {
      updatedAt
      publishedAt
      slug
      title
      description
      socialMediaTitle
      socialMediaDescription
      socialMediaImage {
        ...SimpleImageData
      }
      image {
        ...SimpleImageData
      }

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
        ...PolisConversationBlockData
        ...TikTokVideoBlockData
        ...BildwurfAdBlockData
        ...EmbedBlockData
        ...LinkPageBreakBlockData
        ...ListicleBlockData
        ...QuoteBlockData
        ...TitleBlockData
        ...ArticleGridBlockData
        ...ArticleFlexGridBlockData
      }
    }
  }

  ${pageMetaDataFragment}
  ${richTextBlockDataFragment}
  ${imageBlockDataFragment}
  ${imageGalleryBlockDataFragment}
  ${instagramPostBlockDataFragment}
  ${facebookPostBlockDataFragment}
  ${twitterTweetBlockDataFragment}
  ${vimeoVideoBlockDataFragment}
  ${youtubeVideoBlockDataFragment}
  ${soundCloudTrackBlockDataFragment}
  ${polisConversationBlockDataFragment}
  ${tikTokVideoBlockDataFragment}
  ${bildwurfAdBlockDataFragment}
  ${embedBlockDataFragment}
  ${linkPageBreakBlockDataFragment}
  ${listicleBlockDataFragment}
  ${quoteBlockDataFragment}
  ${titleBlockDataFragment}
  ${gridBlockFrontDataGQLfragment}
  ${flexGridBlockFrontDataGQLfragment}
`

export interface PageTemplateContainerProps {
  slug?: string
  id?: string
  token?: string
}

export function PageTemplateContainer({slug, id, token}: PageTemplateContainerProps) {
  const {canonicalHost} = useAppContext()
  if (!token) token = slug
  const {data, loading, error} = useQuery(PageQuery, {variables: {slug, id, token}})
  if (loading) return <Loader text="Loading" />

  if (error) return <NotFoundTemplate statusCode={500} />
  if (!data?.page) return <NotFoundTemplate />

  const {
    title,
    slug: pageSlug,
    description,
    image,
    socialMediaTitle,
    socialMediaDescription,
    socialMediaImage
  } = data.page

  const path = PageRoute.reverse({slug: pageSlug || undefined})
  const canonicalURL = canonicalHost + path

  return (
    <>
      <Helmet>
        <title>Wepublish | {title}</title>
        {description && <meta name="description" content={description} />}
        <link rel="canonical" href={canonicalURL} />
        <meta property="og:title" content={socialMediaTitle ?? title} />
        {(socialMediaDescription || description) && (
          <meta property="og:description" content={socialMediaDescription ?? description} />
        )}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalURL} />
        {(image || socialMediaImage) && (
          <meta property="og:image" content={socialMediaImage?.ogURL ?? image?.ogURL ?? ''} />
        )}
        <meta name="twitter:card" content="summary_large_image"></meta>
      </Helmet>
      <PageTemplate title={slug !== '' ? data.page.title : undefined}>
        <BlockRenderer
          blocks={getFrontBlocks(data.page.blocks)}
          publishedAt={new Date(data.page.publishedAt)}
          updatedAt={new Date(data.page.updatedAt)}
        />
      </PageTemplate>
    </>
  )
}
