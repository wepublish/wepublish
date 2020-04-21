import gql from 'graphql-tag'

export enum BlockTypes {
  ArticleGridBlock = 'ArticleGridBlock',
  RichTextBlock = 'RichTextBlock',
  ImageBlock = 'ImageBlock',
  ImageGalleryBlock = 'ImageGalleryBlock',
  FacebookPostBlock = 'ImageGalleryBlock',
  InstagramPostBlock = 'InstagramPostBlock',
  TwitterTweetBlock = 'TwitterTweetBlock',
  VimeoVideoBlock = 'TwitterTweetBlock',
  YouTubeVideoBlock = 'YouTubeVideoBlock',
  SoundCloudTrackBlock = 'SoundCloudTrackBlock',
  ListicleBlock = 'ListicleBlock',
  LinkPageBreakBlock = 'LinkPageBreakBlock'
}

export const peerDataFragment = gql`
  fragment PeerData on Peer {
    id
    name
    url
  }
`

export const simpleImageDataFragment = gql`
  fragment SimpleImageData on Image {
    id
    title
    description
    author
    source
    url
    width
    height
    format
    ogURL: transformURL(input: {width: 1200, height: 630})
    smallTeaserURL: transformURL(input: {width: 600, height: 400})
    mediumTeaserURL: transformURL(input: {width: 600, height: 400})
    largeURL: transformURL(input: {height: 700})
    squareURL: transformURL(input: {width: 100, height: 100})
  }
`

export const authorsDataFragment = gql`
  fragment AuthorsData on Author {
    id
    name
    image {
      ...SimpleImageData
    }
  }
  ${simpleImageDataFragment}
`

export const imageEdgeDataFragment = gql`
  fragment ImageEdgeData on GalleryImageEdge {
    caption
    node {
      ...SimpleImageData
    }
  }

  ${simpleImageDataFragment}
`

export const articleMetaDataFragment = gql`
  fragment ArticleMetaData on Article {
    __typename
    id

    updatedAt
    publishedAt

    slug
    preTitle
    title
    lead
    breaking
    tags
    authors {
      ...AuthorsData
    }
    image {
      ...SimpleImageData
    }
  }
  ${simpleImageDataFragment}
  ${authorsDataFragment}
`

export const gridBlockFrontDataGQLfragment = gql`
  fragment ArticleGridBlockData on ArticleTeaserGridBlock {
    numColumns
    teasers {
      type
      article {
        ...ArticleMetaData
      }
    }
  }
  ${simpleImageDataFragment}
  ${articleMetaDataFragment}
`

// # transform(input: [{width: 1280, height: 400}])

export const richTextBlockDataFragment = gql`
  fragment RichtTextBlockData on RichTextBlock {
    __typename
    richText
  }
`

export const imageBlockDataFragment = gql`
  fragment ImageBlockData on ImageBlock {
    __typename
    caption
    image {
      ...SimpleImageData
    }
  }

  ${simpleImageDataFragment}
`

// # transform(input: [{width: 1280}])
export const imageGalleryBlockDataFragment = gql`
  fragment ImageGalleryBlockData on ImageGalleryBlock {
    __typename
    images {
      ...ImageEdgeData
    }
  }
  ${imageEdgeDataFragment}
`
// node {
//   # transform(input: [{width: 600}])
// }

export const facebookPostBlockDataFragment = gql`
  fragment FacebookPostBlockData on FacebookPostBlock {
    __typename
    userID
    postID
  }
`

export const instagramPostBlockDataFragment = gql`
  fragment InstagramPostBlockData on InstagramPostBlock {
    __typename
    postID
  }
`

export const twitterTweetBlockDataFragment = gql`
  fragment TwitterTweetBlockData on TwitterTweetBlock {
    __typename
    userID
    tweetID
  }
`

export const vimeoVideoBlockDataFragment = gql`
  fragment VimeoVideoBlockData on VimeoVideoBlock {
    __typename
    videoID
  }
`

export const youtubeVideoBlockDataFragment = gql`
  fragment YoutubeVideoBlockData on YouTubeVideoBlock {
    __typename
    videoID
  }
`

export const soundCloudTrackBlockDataFragment = gql`
  fragment SoundCloudTrackBlockData on SoundCloudTrackBlock {
    __typename
    trackID
  }
`
export const embedBlockDataFragment = gql`
  fragment EmbedBlockData on EmbedBlock {
    __typename
    title
    url
    width
    height
  }
`

export const listicleBlockDataFragment = gql`
  fragment ListicleBlockData on ListicleBlock {
    __typename
    listicle {
      title
      richText
      image {
        ...SimpleImageData
      }
    }
  }
  ${simpleImageDataFragment}
`

export const linkPageBreakBlockDataFragment = gql`
  fragment LinkPageBreakBlockData on LinkPageBreakBlock {
    __typename
    text
    linkURL
    linkText
  }
`

export const quoteBlockDataFragment = gql`
  fragment QuoteBlockData on QuoteBlock {
    __typename
    quote
    author
  }
`

export const titleBlockDataFragment = gql`
  fragment TitleBlockData on TitleBlock {
    __typename
    title
    lead
  }
`
