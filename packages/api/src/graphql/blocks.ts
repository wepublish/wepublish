import {
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLInterfaceType,
  GraphQLID,
  GraphQLInt,
  GraphQLList
} from 'graphql'

import {GraphQLRichText} from './richText'
import {GraphQLImage} from './image'

import {Context} from '../context'

import {
  BlockType,
  ArticleTeaserGridBlock,
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
  QuoteBlock
} from '../adapter/blocks'

import {ImageEdge} from '../adapter/image'
import {ArticleTeaser, ArticleTeaserOverrides} from '../adapter/article'
import {GraphQLArticle} from './article'

export const GraphQLBaseBlock = new GraphQLInterfaceType({
  name: 'BaseBlock',
  fields: {
    key: {type: GraphQLNonNull(GraphQLID)}
  }
})

export const GraphQLRichTextBlock = new GraphQLObjectType({
  name: 'RichTextBlock',
  fields: {
    key: {type: GraphQLNonNull(GraphQLID)},
    richText: {type: GraphQLNonNull(GraphQLRichText)}
  },
  interfaces: [GraphQLBaseBlock],
  isTypeOf(value) {
    return value.type === BlockType.RichText
  }
})

export const GraphQLArticleTeaserOverrides = new GraphQLObjectType<ArticleTeaserOverrides, Context>(
  {
    name: 'ArticleTeaserOverrides',
    fields: {
      preTitle: {type: GraphQLString},
      title: {type: GraphQLString},
      lead: {type: GraphQLString},
      image: {
        type: GraphQLImage,
        resolve({imageID}, args, {storageAdapter}) {
          return imageID ? storageAdapter.getImage(imageID) : null
        }
      }
    }
  }
)

export const GraphQLArticleTeaser = new GraphQLObjectType<ArticleTeaser, Context>({
  name: 'ArticleTeaser',
  fields: () => ({
    type: {type: GraphQLNonNull(GraphQLString)},
    overrides: {type: GraphQLNonNull(GraphQLArticleTeaserOverrides)},
    article: {
      type: GraphQLNonNull(GraphQLArticle),
      async resolve({articleID}, args, {storageAdapter}) {
        return storageAdapter.getArticle(articleID)
      }
    }
  })
})

export const GraphQLArticleTeaserGridBlock = new GraphQLObjectType<ArticleTeaserGridBlock, Context>(
  {
    name: 'ArticleTeaserGridBlock',
    fields: {
      key: {type: GraphQLNonNull(GraphQLID)},
      teasers: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLArticleTeaser)))},
      numColumns: {type: GraphQLNonNull(GraphQLInt)}
    },
    interfaces: [GraphQLBaseBlock],
    isTypeOf(value) {
      return value.type === BlockType.ArticleTeaserGrid
    }
  }
)

export const GraphQLImageEdge = new GraphQLObjectType<ImageEdge, Context>({
  name: 'ImageEdge',
  fields: {
    description: {type: GraphQLString},
    node: {
      type: GraphQLImage,
      resolve({imageID}, _args, {storageAdapter}) {
        return storageAdapter.getImage(imageID)
      }
    }
  }
})

export const GraphQLImageBlock = new GraphQLObjectType<ImageBlock, Context>({
  name: 'ImageBlock',
  fields: {
    key: {type: GraphQLNonNull(GraphQLID)},
    image: {type: GraphQLImageEdge}
  },
  interfaces: [GraphQLBaseBlock],
  isTypeOf(value) {
    return value.type === BlockType.Image
  }
})

export const GraphQLImageGalleryBlock = new GraphQLObjectType<ImageGalleryBlock, Context>({
  name: 'ImageGalleryBlock',
  fields: {
    key: {type: GraphQLNonNull(GraphQLID)},
    images: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLImageEdge)))
    }
  },
  interfaces: [GraphQLBaseBlock],
  isTypeOf(value) {
    return value.type === BlockType.ImageGallery
  }
})

export const GraphQLFacebookPostBlock = new GraphQLObjectType<FacebookPostBlock, Context>({
  name: 'FacebookPostBlock',
  fields: {
    key: {type: GraphQLNonNull(GraphQLID)},
    userID: {type: GraphQLNonNull(GraphQLString)},
    postID: {type: GraphQLNonNull(GraphQLString)}
  },
  interfaces: [GraphQLBaseBlock],
  isTypeOf(value) {
    return value.type === BlockType.FacebookPost
  }
})

export const GraphQLInstagramPostBlock = new GraphQLObjectType<InstagramPostBlock, Context>({
  name: 'InstagramPostBlock',
  fields: {
    key: {type: GraphQLNonNull(GraphQLID)},
    postID: {type: GraphQLNonNull(GraphQLString)}
  },
  interfaces: [GraphQLBaseBlock],
  isTypeOf(value) {
    return value.type === BlockType.InstagramPost
  }
})

export const GraphQLTwitterTweetBlock = new GraphQLObjectType<TwitterTweetBlock, Context>({
  name: 'TwitterTweetBlock',
  fields: {
    key: {type: GraphQLNonNull(GraphQLID)},
    userID: {type: GraphQLNonNull(GraphQLString)},
    tweetID: {type: GraphQLNonNull(GraphQLString)}
  },
  interfaces: [GraphQLBaseBlock],
  isTypeOf(value) {
    return value.type === BlockType.TwitterTweet
  }
})

export const GraphQLVimeoVideoBlock = new GraphQLObjectType<VimeoVideoBlock, Context>({
  name: 'VimeoVideoBlock',
  fields: {
    key: {type: GraphQLNonNull(GraphQLID)},
    videoID: {type: GraphQLNonNull(GraphQLString)}
  },
  interfaces: [GraphQLBaseBlock],
  isTypeOf(value) {
    return value.type === BlockType.VimeoVideo
  }
})

export const GraphQLYouTubeVideoBlock = new GraphQLObjectType<YouTubeVideoBlock, Context>({
  name: 'YouTubeVideoBlock',
  fields: {
    key: {type: GraphQLNonNull(GraphQLID)},
    videoID: {type: GraphQLNonNull(GraphQLString)}
  },
  interfaces: [GraphQLBaseBlock],
  isTypeOf(value) {
    return value.type === BlockType.YouTubeVideo
  }
})

export const GraphQLSoundCloudTrackBlock = new GraphQLObjectType<SoundCloudTrackBlock, Context>({
  name: 'SoundCloudTrackBlock',
  fields: {
    key: {type: GraphQLNonNull(GraphQLID)},
    trackID: {type: GraphQLNonNull(GraphQLString)}
  },
  interfaces: [GraphQLBaseBlock],
  isTypeOf(value) {
    return value.type === BlockType.SoundCloudTrack
  }
})

export const GraphQLListicleItem = new GraphQLObjectType<ListicleItem, Context>({
  name: 'ListicleItem',
  fields: {
    title: {type: GraphQLNonNull(GraphQLString)},
    image: {
      type: GraphQLImage,
      resolve({imageID}, _args, {storageAdapter}) {
        return imageID ? storageAdapter.getImage(imageID) : null
      }
    },
    richText: {type: GraphQLNonNull(GraphQLRichText)}
  }
})

export const GraphQLListicleBlock = new GraphQLObjectType<ListicleBlock, Context>({
  name: 'ListicleBlock',
  fields: {
    key: {type: GraphQLNonNull(GraphQLID)},
    listicle: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLListicleItem)))}
  },
  interfaces: [GraphQLBaseBlock],
  isTypeOf(value) {
    return value.type === BlockType.Listicle
  }
})

export const GraphQLLinkPageBreakBlock = new GraphQLObjectType<LinkPageBreakBlock, Context>({
  name: 'LinkPageBreakBlock',
  fields: {
    key: {type: GraphQLNonNull(GraphQLID)},
    text: {type: GraphQLNonNull(GraphQLString)},
    linkURL: {type: GraphQLNonNull(GraphQLString)},
    linkText: {type: GraphQLNonNull(GraphQLString)}
  },
  interfaces: [GraphQLBaseBlock],
  isTypeOf(value) {
    return value.type === BlockType.LinkPageBreak
  }
})

export const GraphQLTitleBlock = new GraphQLObjectType<TitleBlock, Context>({
  name: 'TitleBlock',
  fields: {
    key: {type: GraphQLNonNull(GraphQLID)},
    title: {type: GraphQLNonNull(GraphQLString)},
    subtitle: {type: GraphQLNonNull(GraphQLString)}
  },
  interfaces: [GraphQLBaseBlock],
  isTypeOf(value) {
    return value.type === BlockType.Title
  }
})

export const GraphQLQuoteBlock = new GraphQLObjectType<QuoteBlock, Context>({
  name: 'QuoteBlock',
  fields: {
    key: {type: GraphQLNonNull(GraphQLID)},
    text: {type: GraphQLNonNull(GraphQLString)},
    author: {type: GraphQLString}
  },
  interfaces: [GraphQLBaseBlock],
  isTypeOf(value) {
    return value.type === BlockType.Quote
  }
})

export const GraphQLInputRichTextBlock = new GraphQLInputObjectType({
  name: 'InputRichTextBlock',
  fields: {
    richText: {
      type: GraphQLNonNull(GraphQLString)
    }
  }
})
