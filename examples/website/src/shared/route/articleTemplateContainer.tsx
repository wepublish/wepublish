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
  polisConversationBlockDataFragment,
  tikTokVideoBlockDataFragment,
  bildwurfAdBlockDataFragment,
  embedBlockDataFragment,
  linkPageBreakBlockDataFragment,
  listicleBlockDataFragment,
  quoteBlockDataFragment,
  titleBlockDataFragment,
  articleMetaDataFragment,
  gridBlockFrontDataGQLfragment,
  peerMetaDataFragment,
  peerArticleMetaDataFragment,
  flexGridBlockFrontDataGQLfragment
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
import {Image, ImageFit} from '../atoms/image'
import {whenMobile, pxToRem} from '../style/helpers'
import {Color} from '../style/colors'
import {RichTextBlock} from '../blocks/richTextBlock/richTextBlock'

const ArticleQuery = gql`
  query Article($id: ID, $slug: Slug, $token: String) {
    article(id: $id, slug: $slug, token: $token) {
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

  ${articleMetaDataFragment}
  ${richTextBlockDataFragment}
  ${imageBlockDataFragment}
  ${imageGalleryBlockDataFragment}
  ${flexGridBlockFrontDataGQLfragment}
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
  const variables =
    id === 'preview'
      ? {
          token: slug
        }
      : {id}

  const {data, loading, error} = useQuery(ArticleQuery, {variables})

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
    comments,
    canonicalUrl
  } = articleData

  const path = ArticleRoute.reverse({id, slug})
  const canonicalOwnURL = canonicalHost + path
  const canonicalPeerURL = canonicalUrl || canonicalHost + path

  return (
    <>
      <Helmet>
        <title>{title}</title>
        {lead && <meta name="description" content={lead} />}
        <link rel="canonical" href={canonicalPeerURL} />
        <meta property="og:title" content={socialMediaTitle ?? title} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalOwnURL} />
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

      <DesktopSocialMediaButtons shareUrl={canonicalOwnURL} />
      <BlockRenderer
        articleShareUrl={canonicalOwnURL}
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
      ...PeerArticleMetaData

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

  ${peerArticleMetaDataFragment}
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
  ${embedBlockDataFragment}
  ${linkPageBreakBlockDataFragment}
  ${listicleBlockDataFragment}
  ${quoteBlockDataFragment}
  ${titleBlockDataFragment}
  ${gridBlockFrontDataGQLfragment}
  ${flexGridBlockFrontDataGQLfragment}
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

  const canonicalOwnURL = canonicalHost + path
  const canonicalPeerURL = articleData.canonicalUrl || articleData.url

  return (
    <>
      <Helmet>
        <title>{title}</title>
        {lead && <meta name="description" content={lead} />}

        <link rel="canonical" href={canonicalPeerURL} />

        <meta property="og:title" content={socialMediaTitle ?? title} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalOwnURL} />
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

      <DesktopSocialMediaButtons shareUrl={canonicalOwnURL} />
      <PeerProfileBlock peer={peer} article={articleData} />
      <BlockRenderer
        articleShareUrl={canonicalOwnURL}
        authors={authors}
        publishedAt={publishedAt}
        updatedAt={updatedAt}
        isArticle={true}
        blocks={blocks}
        isPeerArticle
      />
      {peer.callToActionImage && peer.callToActionImageURL && (
        <PeerProfileImageBlock peer={peer} article={articleData} />
      )}
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

const PeerProfileBreakStyle = cssRule(({backgroundColor}: any, {themeFontColor}: any) => ({
  backgroundColor: backgroundColor ?? Color.SecondaryLight,
  color: themeFontColor ?? Color.White,
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
  const css = useStyle({backgroundColor: peer.themeColor, themeFontColor: peer.themeFontColor})

  return (
    <div
      id="peer-element"
      data-peer-name={peer.name}
      data-peer-article-id={article.id}
      className={css(PeerProfileBreakStyle)}
      style={{backgroundColor: peer.themeColor, color: peer.themeFontColor}}>
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

export function PeerProfileImageBlock({peer, article}: PeerProfileBlockProps) {
  const css = useStyle()

  return (
    <div className={css(PeerProfileBreakStyle)}>
      {peer?.callToActionImage && (
        <a target="_blank" rel="noreferrer" href={peer?.callToActionImageURL}>
          <div
            style={{
              backgroundColor: 'darkGray',
              border: '1px solid gray',
              display: 'flex',
              width: '100%',
              height: 'auto',
              maxHeight: '90px',
              marginRight: 'auto',
              marginLeft: 'auto'
            }}>
            <Image src={peer?.callToActionImage} fit={ImageFit.Cover} />
          </div>
        </a>
      )}
    </div>
  )
}
