import {
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLUnionType,
  GraphQLEnumType
} from 'graphql'

import {GraphQLRichText} from './richText'
import {GraphQLImage} from './image'

import {Context} from '../context'

import {
  BlockType,
  ImageBlock,
  ImageGalleryBlock,
  FacebookPostBlock,
  InstagramPostBlock,
  TwitterTweetBlock,
  VimeoVideoBlock,
  YouTubeVideoBlock,
  SoundCloudTrackBlock,
  ListicleItem,
  ListicleBlock,
  LinkPageBreakBlock,
  TitleBlock,
  QuoteBlock,
  EmbedBlock,
  ImageCaptionEdge,
  ArticleTeaser,
  TeaserGridBlock,
  TeaserStyle,
  PeerArticleTeaser,
  PageTeaser,
  TeaserType,
  RichTextBlock,
  FacebookVideoBlock,
  CustomContentBlock
} from '../db/block'

import {GraphQLArticle, GraphQLPublicArticle} from './article'
import {GraphQLPage, GraphQLPublicPage} from './page'
import {GraphQLPeer} from './peer'
import {createProxyingResolver, createProxyingIsTypeOf, delegateToPeerSchema} from '../utility'

export const GraphQLRichTextBlock = new GraphQLObjectType<RichTextBlock>({
  name: 'RichTextBlock',
  fields: {
    richText: {type: GraphQLNonNull(GraphQLRichText)}
  },
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === BlockType.RichText
  })
})

export const GraphQLArticleTeaser = new GraphQLObjectType<ArticleTeaser, Context>({
  name: 'ArticleTeaser',
  fields: () => ({
    style: {type: GraphQLNonNull(GraphQLTeaserStyle)},

    image: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({imageID}, {}, {loaders}) =>
        imageID ? loaders.images.load(imageID) : null
      )
    },

    preTitle: {type: GraphQLString},
    title: {type: GraphQLString},
    lead: {type: GraphQLString},

    article: {
      type: GraphQLArticle,
      resolve: createProxyingResolver(({articleID}, args, {loaders}) => {
        return loaders.articles.load(articleID)
      })
    }
  }),
  isTypeOf: createProxyingIsTypeOf(value => value.type === TeaserType.Article)
})

export const GraphQLPeerArticleTeaser = new GraphQLObjectType<PeerArticleTeaser, Context>({
  name: 'PeerArticleTeaser',
  fields: () => ({
    style: {type: GraphQLNonNull(GraphQLTeaserStyle)},

    image: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({imageID}, {}, {loaders}) =>
        imageID ? loaders.images.load(imageID) : null
      )
    },

    preTitle: {type: GraphQLString},
    title: {type: GraphQLString},
    lead: {type: GraphQLString},

    peer: {
      type: GraphQLPeer,
      resolve: createProxyingResolver(({peerID}, args, {loaders}) => {
        return loaders.peer.load(peerID)
      })
    },

    articleID: {type: GraphQLNonNull(GraphQLID)},
    article: {
      type: GraphQLArticle,
      resolve: createProxyingResolver(async ({peerID, articleID}, args, context, info) => {
        return delegateToPeerSchema(peerID, true, context, {
          fieldName: 'article',
          args: {id: articleID},
          info
        })
      })
    }
  }),
  isTypeOf: createProxyingIsTypeOf(value => value.type === TeaserType.PeerArticle)
})

export const GraphQLPageTeaser = new GraphQLObjectType<PageTeaser, Context>({
  name: 'PageTeaser',
  fields: () => ({
    style: {type: GraphQLNonNull(GraphQLTeaserStyle)},

    image: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({imageID}, {}, {loaders}) =>
        imageID ? loaders.images.load(imageID) : null
      )
    },

    preTitle: {type: GraphQLString},
    title: {type: GraphQLString},
    lead: {type: GraphQLString},

    page: {
      type: GraphQLPage,
      resolve: createProxyingResolver(({pageID}, args, {loaders}) => {
        return loaders.pages.load(pageID)
      })
    }
  }),

  isTypeOf: createProxyingIsTypeOf(value => value.type === TeaserType.Page)
})

export const GraphQLTeaserStyle = new GraphQLEnumType({
  name: 'TeaserStyle',
  values: {
    DEFAULT: {value: TeaserStyle.Default},
    LIGHT: {value: TeaserStyle.Light},
    TEXT: {value: TeaserStyle.Text}
  }
})

export const GraphQLTeaser = new GraphQLUnionType({
  name: 'Teaser',
  types: [GraphQLArticleTeaser, GraphQLPeerArticleTeaser, GraphQLPageTeaser]
})

export const GraphQLTeaserGridBlock = new GraphQLObjectType<TeaserGridBlock, Context>({
  name: 'TeaserGridBlock',
  fields: {
    teasers: {type: GraphQLNonNull(GraphQLList(GraphQLTeaser))},
    numColumns: {type: GraphQLNonNull(GraphQLInt)}
  },
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === BlockType.TeaserGrid
  })
})

export const GraphQLPublicArticleTeaser = new GraphQLObjectType<ArticleTeaser, Context>({
  name: 'ArticleTeaser',
  fields: () => ({
    style: {type: GraphQLNonNull(GraphQLTeaserStyle)},

    image: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({imageID}, {}, {loaders}) =>
        imageID ? loaders.images.load(imageID) : null
      )
    },

    preTitle: {type: GraphQLString},
    title: {type: GraphQLString},
    lead: {type: GraphQLString},

    article: {
      type: GraphQLPublicArticle,
      resolve: createProxyingResolver(({articleID}, args, {loaders}) => {
        return loaders.publicArticles.load(articleID)
      })
    }
  }),
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === TeaserType.Article
  })
})

export const GraphQLPublicPeerArticleTeaser = new GraphQLObjectType<PeerArticleTeaser, Context>({
  name: 'PeerArticleTeaser',
  fields: () => ({
    style: {type: GraphQLNonNull(GraphQLTeaserStyle)},

    image: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({imageID}, {}, {loaders}) =>
        imageID ? loaders.images.load(imageID) : null
      )
    },

    preTitle: {type: GraphQLString},
    title: {type: GraphQLString},
    lead: {type: GraphQLString},

    peer: {
      type: GraphQLPeer,
      resolve: createProxyingResolver(({peerID}, args, {loaders}) => {
        return loaders.peer.load(peerID)
      })
    },

    articleID: {type: GraphQLNonNull(GraphQLID)},
    article: {
      type: GraphQLPublicArticle,
      resolve: createProxyingResolver(({peerID, articleID}, args, context, info) => {
        return delegateToPeerSchema(peerID, false, context, {
          fieldName: 'article',
          args: {id: articleID},
          info
        })
      })
    }
  }),
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === TeaserType.PeerArticle
  })
})

export const GraphQLPublicPageTeaser = new GraphQLObjectType<PageTeaser, Context>({
  name: 'PageTeaser',
  fields: () => ({
    style: {type: GraphQLNonNull(GraphQLTeaserStyle)},

    image: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({imageID}, {}, {loaders}) =>
        imageID ? loaders.images.load(imageID) : null
      )
    },

    preTitle: {type: GraphQLString},
    title: {type: GraphQLString},
    lead: {type: GraphQLString},

    page: {
      type: GraphQLPublicPage,
      resolve: createProxyingResolver(({pageID}, args, {loaders}) => {
        return loaders.publicPagesByID.load(pageID)
      })
    }
  }),
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === TeaserType.Page
  })
})

export const GraphQLPublicTeaser = new GraphQLUnionType({
  name: 'Teaser',
  types: [GraphQLPublicArticleTeaser, GraphQLPublicPeerArticleTeaser, GraphQLPublicPageTeaser]
})

export const GraphQLPublicTeaserGridBlock = new GraphQLObjectType<TeaserGridBlock, Context>({
  name: 'TeaserGridBlock',
  fields: {
    teasers: {type: GraphQLNonNull(GraphQLList(GraphQLPublicTeaser))},
    numColumns: {type: GraphQLNonNull(GraphQLInt)}
  },
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === BlockType.TeaserGrid
  })
})

export const GraphQLGalleryImageEdge = new GraphQLObjectType<ImageCaptionEdge, Context>({
  name: 'GalleryImageEdge',
  fields: {
    caption: {type: GraphQLString},
    image: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({imageID}, args, {loaders}) => {
        return imageID ? loaders.images.load(imageID) : null
      })
    }
  }
})

export const GraphQLImageBlock = new GraphQLObjectType<ImageBlock, Context>({
  name: 'ImageBlock',
  fields: {
    image: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({imageID}, _args, {loaders}) => {
        return imageID ? loaders.images.load(imageID) : null
      })
    },

    caption: {type: GraphQLString}
  },
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === BlockType.Image
  })
})

export const GraphQLImageGalleryBlock = new GraphQLObjectType<ImageGalleryBlock, Context>({
  name: 'ImageGalleryBlock',
  fields: {
    images: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLGalleryImageEdge)))
    }
  },
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === BlockType.ImageGallery
  })
})

export const GraphQLFacebookPostBlock = new GraphQLObjectType<FacebookPostBlock, Context>({
  name: 'FacebookPostBlock',
  fields: {
    userID: {type: GraphQLNonNull(GraphQLString)},
    postID: {type: GraphQLNonNull(GraphQLString)}
  },
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === BlockType.FacebookPost
  })
})

export const GraphQLFacebookVideoBlock = new GraphQLObjectType<FacebookVideoBlock, Context>({
  name: 'FacebookVideoBlock',
  fields: {
    userID: {type: GraphQLNonNull(GraphQLString)},
    videoID: {type: GraphQLNonNull(GraphQLString)}
  },
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === BlockType.FacebookVideo
  })
})

export const GraphQLInstagramPostBlock = new GraphQLObjectType<InstagramPostBlock, Context>({
  name: 'InstagramPostBlock',
  fields: {
    postID: {type: GraphQLNonNull(GraphQLString)}
  },
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === BlockType.InstagramPost
  })
})

export const GraphQLTwitterTweetBlock = new GraphQLObjectType<TwitterTweetBlock, Context>({
  name: 'TwitterTweetBlock',
  fields: {
    userID: {type: GraphQLNonNull(GraphQLString)},
    tweetID: {type: GraphQLNonNull(GraphQLString)}
  },
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === BlockType.TwitterTweet
  })
})

export const GraphQLVimeoVideoBlock = new GraphQLObjectType<VimeoVideoBlock, Context>({
  name: 'VimeoVideoBlock',
  fields: {
    videoID: {type: GraphQLNonNull(GraphQLString)}
  },
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === BlockType.VimeoVideo
  })
})

export const GraphQLYouTubeVideoBlock = new GraphQLObjectType<YouTubeVideoBlock, Context>({
  name: 'YouTubeVideoBlock',
  fields: {
    videoID: {type: GraphQLNonNull(GraphQLString)}
  },
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === BlockType.YouTubeVideo
  })
})

export const GraphQLSoundCloudTrackBlock = new GraphQLObjectType<SoundCloudTrackBlock, Context>({
  name: 'SoundCloudTrackBlock',
  fields: {
    trackID: {type: GraphQLNonNull(GraphQLString)}
  },
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === BlockType.SoundCloudTrack
  })
})

export const GraphQLEmbedBlock = new GraphQLObjectType<EmbedBlock, Context>({
  name: 'EmbedBlock',
  fields: {
    url: {type: GraphQLString},
    title: {type: GraphQLString},
    width: {type: GraphQLInt},
    height: {type: GraphQLInt}
  },
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === BlockType.Embed
  })
})

export const GraphQLListicleItem = new GraphQLObjectType<ListicleItem, Context>({
  name: 'ListicleItem',
  fields: {
    title: {type: GraphQLNonNull(GraphQLString)},
    image: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({imageID}, _args, {loaders}) => {
        return imageID ? loaders.images.load(imageID) : null
      })
    },
    richText: {type: GraphQLNonNull(GraphQLRichText)}
  }
})

export const GraphQLListicleBlock = new GraphQLObjectType<ListicleBlock, Context>({
  name: 'ListicleBlock',
  fields: {
    items: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLListicleItem)))}
  },
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === BlockType.Listicle
  })
})

export const GraphQLLinkPageBreakBlock = new GraphQLObjectType<LinkPageBreakBlock, Context>({
  name: 'LinkPageBreakBlock',
  fields: {
    text: {type: GraphQLString},
    linkURL: {type: GraphQLString},
    linkText: {type: GraphQLString}
  },
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === BlockType.LinkPageBreak
  })
})

export const GraphQLTitleBlock = new GraphQLObjectType<TitleBlock, Context>({
  name: 'TitleBlock',
  fields: {
    title: {type: GraphQLString},
    lead: {type: GraphQLString}
  },
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === BlockType.Title
  })
})

export const GraphQLQuoteBlock = new GraphQLObjectType<QuoteBlock, Context>({
  name: 'QuoteBlock',
  fields: {
    quote: {type: GraphQLString},
    author: {type: GraphQLString}
  },
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === BlockType.Quote
  })
})

export const GraphQLCustomContentBlock = new GraphQLObjectType<CustomContentBlock, Context>({
  name: 'CustomContentBlock',
  fields: {
    kind: {type: GraphQLNonNull(GraphQLString)},
    content: {type: GraphQLNonNull(GraphQLString)},
    format: {type: GraphQLNonNull(GraphQLString)},
    width: {type: GraphQLInt},
    height: {type: GraphQLInt}
  },
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === BlockType.CustomContent
  })
})

export const GraphQLRichTextBlockInput = new GraphQLInputObjectType({
  name: 'RichTextBlockInput',
  fields: {
    richText: {
      type: GraphQLNonNull(GraphQLRichText)
    }
  }
})

export const GraphQLTitleBlockInput = new GraphQLInputObjectType({
  name: 'TitleBlockInput',
  fields: {
    title: {type: GraphQLString},
    lead: {type: GraphQLString}
  }
})

export const GraphQLImageBlockInput = new GraphQLInputObjectType({
  name: 'ImageBlockInput',
  fields: {
    caption: {type: GraphQLString},
    imageID: {type: GraphQLID}
  }
})

export const GraphQLGalleryImageEdgeInput = new GraphQLInputObjectType({
  name: 'GalleryImageEdgeInput',
  fields: {
    caption: {type: GraphQLString},
    imageID: {type: GraphQLID}
  }
})

export const GraphQLImageGalleryBlockInput = new GraphQLInputObjectType({
  name: 'ImageGalleryBlockInput',
  fields: {
    images: {type: GraphQLList(GraphQLGalleryImageEdgeInput)}
  }
})

export const GraphQLListicleItemInput = new GraphQLInputObjectType({
  name: 'ListicleItemInput',
  fields: {
    title: {type: GraphQLNonNull(GraphQLString)},
    imageID: {type: GraphQLID},
    richText: {type: GraphQLNonNull(GraphQLRichText)}
  }
})

export const GraphQLListicleBlockInput = new GraphQLInputObjectType({
  name: 'ListicleBlockInput',
  fields: {
    items: {type: GraphQLList(GraphQLListicleItemInput)}
  }
})

export const GraphQLQuoteBlockInput = new GraphQLInputObjectType({
  name: 'QuoteBlockInput',
  fields: {
    quote: {type: GraphQLString},
    author: {type: GraphQLString}
  }
})

export const GraphQLLinkPageBreakBlockInput = new GraphQLInputObjectType({
  name: 'LinkPageBreakBlockInput',
  fields: {
    text: {type: GraphQLString},
    linkURL: {type: GraphQLString},
    linkText: {type: GraphQLString}
  }
})

export const GraphQLFacebookPostBlockInput = new GraphQLInputObjectType({
  name: 'FacebookPostBlockInput',
  fields: {
    userID: {type: GraphQLNonNull(GraphQLString)},
    postID: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLFacebookVideoBlockInput = new GraphQLInputObjectType({
  name: 'FacebookVideoBlockInput',
  fields: {
    userID: {type: GraphQLNonNull(GraphQLString)},
    videoID: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLInstagramPostBlockInput = new GraphQLInputObjectType({
  name: 'InstagramPostBlockInput',
  fields: {
    postID: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLTwitterTweetBlockInput = new GraphQLInputObjectType({
  name: 'TwitterTweetBlockInput',
  fields: {
    userID: {type: GraphQLNonNull(GraphQLString)},
    tweetID: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLVimeoVideoBlockInput = new GraphQLInputObjectType({
  name: 'VimeoVideoBlockInput',
  fields: {
    videoID: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLYouTubeVideoBlockInput = new GraphQLInputObjectType({
  name: 'YouTubeVideoBlockInput',
  fields: {
    videoID: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLSoundCloudTrackBlockInput = new GraphQLInputObjectType({
  name: 'SoundCloudTrackBlockInput',
  fields: {
    trackID: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLEmbedBlockInput = new GraphQLInputObjectType({
  name: 'EmbedBlockInput',
  fields: {
    url: {type: GraphQLString},
    title: {type: GraphQLString},
    width: {type: GraphQLInt},
    height: {type: GraphQLInt}
  }
})

export const GraphQLArticleTeaserInput = new GraphQLInputObjectType({
  name: 'ArticleTeaserInput',
  fields: {
    style: {type: GraphQLNonNull(GraphQLTeaserStyle)},
    imageID: {type: GraphQLID},
    preTitle: {type: GraphQLString},
    title: {type: GraphQLString},
    lead: {type: GraphQLString},
    articleID: {type: GraphQLNonNull(GraphQLID)}
  }
})

export const GraphQLPeerArticleTeaserInput = new GraphQLInputObjectType({
  name: 'PeerArticleTeaserInput',
  fields: {
    style: {type: GraphQLNonNull(GraphQLTeaserStyle)},
    imageID: {type: GraphQLID},
    preTitle: {type: GraphQLString},
    title: {type: GraphQLString},
    lead: {type: GraphQLString},
    peerID: {type: GraphQLNonNull(GraphQLID)},
    articleID: {type: GraphQLNonNull(GraphQLID)}
  }
})

export const GraphQLPageTeaserInput = new GraphQLInputObjectType({
  name: 'PageTeaserInput',
  fields: {
    style: {type: GraphQLNonNull(GraphQLTeaserStyle)},
    imageID: {type: GraphQLID},
    preTitle: {type: GraphQLString},
    title: {type: GraphQLString},
    lead: {type: GraphQLString},
    pageID: {type: GraphQLNonNull(GraphQLID)}
  }
})

export const GraphQLTeaserInput = new GraphQLInputObjectType({
  name: 'TeaserInput',
  fields: () => ({
    [TeaserType.Article]: {type: GraphQLArticleTeaserInput},
    [TeaserType.PeerArticle]: {type: GraphQLPeerArticleTeaserInput},
    [TeaserType.Page]: {type: GraphQLPageTeaserInput}
  })
})

export const GraphQLTeaserGridBlockInput = new GraphQLInputObjectType({
  name: 'TeaserGridBlockInput',
  fields: {
    teasers: {type: GraphQLNonNull(GraphQLList(GraphQLTeaserInput))},
    numColumns: {type: GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLCustomContentBlockInput = new GraphQLInputObjectType({
  name: 'CustomContentBlockInput',
  fields: {
    kind: {type: GraphQLNonNull(GraphQLString)},
    content: {type: GraphQLNonNull(GraphQLString)},
    format: {type: GraphQLNonNull(GraphQLString)},
    width: {type: GraphQLInt},
    height: {type: GraphQLInt}
  }
})

export const GraphQLBlockInput = new GraphQLInputObjectType({
  name: 'BlockInput',
  fields: () => ({
    [BlockType.RichText]: {type: GraphQLRichTextBlockInput},
    [BlockType.Image]: {type: GraphQLImageBlockInput},
    [BlockType.ImageGallery]: {type: GraphQLImageGalleryBlockInput},
    [BlockType.Listicle]: {type: GraphQLListicleBlockInput},
    [BlockType.Title]: {type: GraphQLTitleBlockInput},
    [BlockType.Quote]: {type: GraphQLQuoteBlockInput},
    [BlockType.FacebookPost]: {type: GraphQLFacebookPostBlockInput},
    [BlockType.FacebookVideo]: {type: GraphQLFacebookVideoBlockInput},
    [BlockType.InstagramPost]: {type: GraphQLInstagramPostBlockInput},
    [BlockType.TwitterTweet]: {type: GraphQLTwitterTweetBlockInput},
    [BlockType.VimeoVideo]: {type: GraphQLVimeoVideoBlockInput},
    [BlockType.YouTubeVideo]: {type: GraphQLYouTubeVideoBlockInput},
    [BlockType.SoundCloudTrack]: {type: GraphQLSoundCloudTrackBlockInput},
    [BlockType.Embed]: {type: GraphQLEmbedBlockInput},
    [BlockType.LinkPageBreak]: {type: GraphQLLinkPageBreakBlockInput},
    [BlockType.TeaserGrid]: {type: GraphQLTeaserGridBlockInput},
    [BlockType.CustomContent]: {type: GraphQLCustomContentBlockInput}
  })
})

export const GraphQLBlock: GraphQLUnionType = new GraphQLUnionType({
  name: 'Block',
  types: () => [
    GraphQLRichTextBlock,
    GraphQLImageBlock,
    GraphQLImageGalleryBlock,
    GraphQLListicleBlock,
    GraphQLFacebookPostBlock,
    GraphQLFacebookVideoBlock,
    GraphQLInstagramPostBlock,
    GraphQLTwitterTweetBlock,
    GraphQLVimeoVideoBlock,
    GraphQLYouTubeVideoBlock,
    GraphQLSoundCloudTrackBlock,
    GraphQLEmbedBlock,
    GraphQLLinkPageBreakBlock,
    GraphQLTitleBlock,
    GraphQLQuoteBlock,
    GraphQLTeaserGridBlock,
    GraphQLCustomContentBlock
  ]
})

export const GraphQLPublicBlock: GraphQLUnionType = new GraphQLUnionType({
  name: 'Block',
  types: () => [
    GraphQLRichTextBlock,
    GraphQLImageBlock,
    GraphQLImageGalleryBlock,
    GraphQLListicleBlock,
    GraphQLFacebookPostBlock,
    GraphQLInstagramPostBlock,
    GraphQLTwitterTweetBlock,
    GraphQLVimeoVideoBlock,
    GraphQLYouTubeVideoBlock,
    GraphQLSoundCloudTrackBlock,
    GraphQLEmbedBlock,
    GraphQLLinkPageBreakBlock,
    GraphQLTitleBlock,
    GraphQLQuoteBlock,
    GraphQLPublicTeaserGridBlock,
    GraphQLCustomContentBlock
  ]
})
