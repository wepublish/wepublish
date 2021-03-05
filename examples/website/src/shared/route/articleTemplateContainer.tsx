import React from 'react'

import {gql, useQuery} from '@apollo/client'
import {articleAdapter, peerAdapter} from './articleAdapter'

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
  gridBlockFrontDataGQLfragment,
  peerMetaDataFragment
} from './gqlFragments'

import {BlockRenderer} from '../blocks/blockRenderer'
import {ArticleFooterContainer} from './footerContainer'
import {DesktopSocialMediaButtons} from '../atoms/socialMediaButtons'
import {Loader} from '../atoms/loader'
import {NotFoundTemplate} from '../templates/notFoundTemplate'
import {Helmet} from 'react-helmet-async'
import {ArticleRoute, PeerArticleRoute, Link} from './routeContext'
import {useAppContext} from '../appContext'
import {Peer, ArticleMeta} from '../types'
import {useStyle, cssRule} from '@karma.run/react'
import {Image} from '../atoms/image'
import {whenMobile, pxToRem} from '../style/helpers'
import {Color} from '../style/colors'
import {RichTextBlock} from '../blocks/richTextBlock/richTextBlock'

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

const mapAuthors = (metaData: any[] | undefined) => {
  return metaData?.map((author, index) => {
    return <meta key={index} property="article:author" content={author.url} />
  })
}

export function ArticleTemplateContainer({id, slug}: ArticleTemplateContainerProps) {
  const {canonicalHost} = useAppContext()
  const {data, loading, error} = useQuery(ArticleQuery, {variables: {id}})

  if (error) return <NotFoundTemplate statusCode={500} />

  if (loading) return <Loader text="Loading" />

  const articleData = articleAdapter(data.article)

  if (!articleData) return <NotFoundTemplate />

  const {
    title,
    lead,
    image,
    tags,
    authors,
    publishedAt,
    updatedAt,
    blocks,
    socialMediaTitle,
    socialMediaDescription,
    socialMediaImage,
    socialMediaAuthors,
    comments
  } = articleData

  const path = ArticleRoute.reverse({id, slug})
  const canonicalURL = canonicalHost + path
  return (
    <>
      <Helmet>
        <title>{title}</title>
        {lead && <meta name="description" content={lead} />}
        <link rel="canonical" href={canonicalURL} />
        <meta property="og:title" content={socialMediaTitle ?? title} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalURL} />
        {socialMediaDescription && (
          <meta property="og:description" content={socialMediaDescription} />
        )}
        {(image || socialMediaImage) && (
          <meta property="og:image" content={socialMediaImage?.ogURL ?? image?.ogURL ?? ''} />
        )}
        {socialMediaAuthors && mapAuthors(socialMediaAuthors)}
        {socialMediaAuthors?.length === 0 && mapAuthors(authors)}

        <meta property="article:published_time" content={publishedAt.toISOString()} />
        <meta property="article:modified_time" content={updatedAt.toISOString()} />
        {tags.map(tag => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
        <meta name="twitter:card" content="summary_large_image"></meta>
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
      <ArticleFooterContainer
        tags={tags}
        authors={authors}
        publishDate={publishedAt}
        id={id}
        comments={comments}
      />
    </>
  )
}

const PeerQuery = gql`
  query Peer($id: ID!) {
    peer(id: $id) {
      ...PeerMetaData
    }
  }

  ${peerMetaDataFragment}
`

const PeerArticleQuery = gql`
  query PeerArticle($peerID: ID!, $id: ID!) {
    peerArticle(peerID: $peerID, id: $id) {
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

export interface PeerArticleTemplateContainerProps {
  peerID: string
  id: string
  slug?: string
}

export function PeerArticleTemplateContainer({
  peerID,
  id,
  slug
}: PeerArticleTemplateContainerProps) {
  const {canonicalHost} = useAppContext()
  const {data, loading} = useQuery(PeerArticleQuery, {variables: {peerID, id}})
  const {data: peerData, loading: isPeerLoading} = useQuery(PeerQuery, {variables: {id: peerID}})

  if (loading || isPeerLoading) return <Loader text="Loading" />

  const articleData = articleAdapter(data.peerArticle)
  const peer = peerAdapter(peerData.peer)

  if (!articleData || !peer) return <NotFoundTemplate />

  const {
    title,
    lead,
    image,
    tags,
    authors,
    publishedAt,
    updatedAt,
    blocks,
    socialMediaImage,
    socialMediaDescription,
    socialMediaTitle,
    socialMediaAuthors
  } = articleData

  const path = PeerArticleRoute.reverse({peerID: '12', id, slug})
  const canonicalURL = canonicalHost + path

  return (
    <>
      <Helmet>
        <title>{title}</title>
        {lead && <meta name="description" content={lead} />}

        <link rel="canonical" href={canonicalURL} />

        <meta property="og:title" content={socialMediaTitle ?? title} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalURL} />
        {socialMediaDescription && (
          <meta property="og:description" content={socialMediaDescription} />
        )}
        {(image || socialMediaImage) && (
          <meta property="og:image" content={socialMediaImage?.ogURL ?? image?.ogURL ?? ''} />
        )}
        {socialMediaAuthors && mapAuthors(socialMediaAuthors)}
        {socialMediaAuthors?.length === 0 && mapAuthors(authors)}

        <meta property="article:published_time" content={publishedAt.toISOString()} />
        <meta property="article:modified_time" content={updatedAt.toISOString()} />

        {tags.map(tag => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
      </Helmet>

      <DesktopSocialMediaButtons shareUrl={canonicalURL} />
      <PeerProfileBlock peer={peer} article={articleData} />
      <BlockRenderer
        articleShareUrl={canonicalURL}
        authors={authors}
        publishedAt={publishedAt}
        updatedAt={updatedAt}
        isArticle={true}
        blocks={blocks}
        isPeerArticle
      />
      <ArticleFooterContainer
        tags={tags}
        authors={authors}
        publishDate={publishedAt}
        id={id}
        isPeerArticle
      />
    </>
  )
}

const PeerProfileBreakStyle = cssRule(isArticle => ({
  backgroundColor: Color.SecondaryLight,
  padding: `${pxToRem(25)} ${pxToRem(125)}`,
  borderTop: `1px solid ${Color.Secondary}`,
  borderBottom: `1px solid ${Color.Primary}`,

  ...whenMobile({
    padding: pxToRem(25)
  })
}))

const PeerProfileInnerStyle = cssRule({
  maxWidth: pxToRem(1600),
  margin: '0 auto',
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'row',
  justifyContent: 'space-between',

  ...whenMobile({
    flexDirection: 'column'
  })
})

const PeerProfileFiller = cssRule({
  flexGrow: 1,
  flexBasis: 0
})

const PeerProfileNameContainer = cssRule({
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'row',
  justifyContent: 'space-between',
  flexBasis: 0
})

const PeerProfileCallToActionURL = cssRule({
  textAlign: 'center'
})

const PeerProfileImageStyle = cssRule({
  width: pxToRem(50),
  height: pxToRem(50),
  flexShrink: 0,
  marginRight: pxToRem(10),
  borderRadius: '50%',
  border: `1px solid ${Color.Black}`,
  overflow: 'hidden'
})

const PeerProfileTextStyle = cssRule({
  width: '100%',
  textTransform: 'uppercase',
  fontSize: pxToRem(35),
  margin: `${pxToRem(15)} 0`
})

export interface PeerProfileBlockProps {
  peer: Peer
  article: ArticleMeta
}

export function PeerProfileBlock({peer, article}: PeerProfileBlockProps) {
  const css = useStyle()

  return (
    <div className={css(PeerProfileBreakStyle)}>
      <div className={css(PeerProfileInnerStyle)}>
        <div className={css(PeerProfileFiller)}>
          <Link href={article.url}>Zum Originalartikel</Link>
        </div>
        <div className={css(PeerProfileNameContainer)}>
          <div className={css(PeerProfileImageStyle)}>
            <Image src={peer.logoURL} height={50} width={50} />
          </div>
          <p className={css(PeerProfileTextStyle)}>{peer.name}</p>
        </div>
        <div className={css(PeerProfileFiller)} />
      </div>
      <div className={css(PeerProfileCallToActionURL)}>
        {peer?.callToActionText?.length && (
          <a target="_blank" rel="noreferrer" href={peer?.callToActionURL}>
            <RichTextBlock
              value={peer?.callToActionText}
              displayOnly
              disabled
              onChange={() => {
                /* do nothing */
              }}
            />
          </a>
        )}
      </div>
    </div>
  )
}
