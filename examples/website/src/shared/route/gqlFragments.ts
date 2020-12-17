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
    url
    slug
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
    image {
      ...SimpleImageData
    }
  }

  ${simpleImageDataFragment}
`

export const articleMetaDataFragment = gql`
  fragment ArticleMetaData on Article {
    __typename
    id
    url

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

    socialMediaTitle
    socialMediaDescription
    socialMediaAuthors {
      ...AuthorsData
    }
    socialMediaImage {
      ...SimpleImageData
    }
  }
  ${simpleImageDataFragment}
  ${authorsDataFragment}
`

export const pageMetaDataFragment = gql`
  fragment PageMetaData on Page {
    __typename
    id
    url

    updatedAt
    publishedAt

    slug

    title
    description

    image {
      ...SimpleImageData
    }
  }
  ${simpleImageDataFragment}
`

export const peerMetaDataFragment = gql`
  fragment PeerMetaData on Peer {
    id
    slug
    profile {
      name
      websiteURL
      themeColor
      logo {
        ...SimpleImageData
      }
      callToActionText
      callToActionURL
    }
  }
  ${simpleImageDataFragment}
`

export const gridBlockFrontDataGQLfragment = gql`
  fragment ArticleGridBlockData on TeaserGridBlock {
    numColumns
    teasers {
      __typename

      ... on ArticleTeaser {
        style

        image {
          ...SimpleImageData
        }

        preTitle
        title
        lead

        article {
          ...ArticleMetaData
        }
      }

      ... on PeerArticleTeaser {
        style

        image {
          ...SimpleImageData
        }

        preTitle
        title
        lead

        peer {
          ...PeerMetaData
        }

        articleID
        article {
          ...ArticleMetaData
        }
      }

      ... on PageTeaser {
        style

        image {
          ...SimpleImageData
        }

        preTitle
        title
        lead

        page {
          ...PageMetaData
        }
      }
    }
  }
  ${simpleImageDataFragment}
  ${articleMetaDataFragment}
  ${pageMetaDataFragment}
  ${peerMetaDataFragment}
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
    styleCustom
  }
`

export const listicleBlockDataFragment = gql`
  fragment ListicleBlockData on ListicleBlock {
    __typename
    items {
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
    richText
    linkURL
    linkText
    hideButton
    linkTarget
    styleOption
    layoutOption
    templateOption
    image {
      ...SimpleImageData
    }
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
