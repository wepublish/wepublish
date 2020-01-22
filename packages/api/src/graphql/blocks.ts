import {
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLString,
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
  QuoteBlock,
  EmbedBlock
} from '../adapter/blocks'

import {ImageCaptionEdge} from '../adapter/image'
import {ArticleTeaser, ArticleTeaserOverrides} from '../adapter/article'
import {GraphQLArticle} from './article'

export const GraphQLRichTextBlock = new GraphQLObjectType({
  name: 'RichTextBlock',
  fields: {
    richText: {type: GraphQLNonNull(GraphQLRichText)}
  },
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
    type: {type: GraphQLString},
    overrides: {type: GraphQLArticleTeaserOverrides},
    article: {
      type: GraphQLArticle,
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
      teasers: {type: GraphQLNonNull(GraphQLList(GraphQLArticleTeaser))},
      numColumns: {type: GraphQLNonNull(GraphQLInt)}
    },
    isTypeOf(value) {
      return value.type === BlockType.ArticleTeaserGrid
    }
  }
)

export const GraphQLGalleryImageEdge = new GraphQLObjectType<ImageCaptionEdge, Context>({
  name: 'GalleryImageEdge',
  fields: {
    caption: {type: GraphQLString},
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
    image: {
      type: GraphQLImage,
      resolve({imageID}, _args, {storageAdapter}) {
        if (!imageID) return null
        return storageAdapter.getImage(imageID)
      }
    },

    caption: {type: GraphQLString}
  },
  isTypeOf(value) {
    return value.type === BlockType.Image
  }
})

export const GraphQLImageGalleryBlock = new GraphQLObjectType<ImageGalleryBlock, Context>({
  name: 'ImageGalleryBlock',
  fields: {
    images: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLGalleryImageEdge)))
    }
  },
  isTypeOf(value) {
    return value.type === BlockType.ImageGallery
  }
})

export const GraphQLFacebookPostBlock = new GraphQLObjectType<FacebookPostBlock, Context>({
  name: 'FacebookPostBlock',
  fields: {
    userID: {type: GraphQLNonNull(GraphQLString)},
    postID: {type: GraphQLNonNull(GraphQLString)}
  },
  isTypeOf(value) {
    return value.type === BlockType.FacebookPost
  }
})

export const GraphQLInstagramPostBlock = new GraphQLObjectType<InstagramPostBlock, Context>({
  name: 'InstagramPostBlock',
  fields: {
    postID: {type: GraphQLNonNull(GraphQLString)}
  },
  isTypeOf(value) {
    return value.type === BlockType.InstagramPost
  }
})

export const GraphQLTwitterTweetBlock = new GraphQLObjectType<TwitterTweetBlock, Context>({
  name: 'TwitterTweetBlock',
  fields: {
    userID: {type: GraphQLNonNull(GraphQLString)},
    tweetID: {type: GraphQLNonNull(GraphQLString)}
  },
  isTypeOf(value) {
    return value.type === BlockType.TwitterTweet
  }
})

export const GraphQLVimeoVideoBlock = new GraphQLObjectType<VimeoVideoBlock, Context>({
  name: 'VimeoVideoBlock',
  fields: {
    videoID: {type: GraphQLNonNull(GraphQLString)}
  },
  isTypeOf(value) {
    return value.type === BlockType.VimeoVideo
  }
})

export const GraphQLYouTubeVideoBlock = new GraphQLObjectType<YouTubeVideoBlock, Context>({
  name: 'YouTubeVideoBlock',
  fields: {
    videoID: {type: GraphQLNonNull(GraphQLString)}
  },
  isTypeOf(value) {
    return value.type === BlockType.YouTubeVideo
  }
})

export const GraphQLSoundCloudTrackBlock = new GraphQLObjectType<SoundCloudTrackBlock, Context>({
  name: 'SoundCloudTrackBlock',
  fields: {
    trackID: {type: GraphQLNonNull(GraphQLString)}
  },
  isTypeOf(value) {
    return value.type === BlockType.SoundCloudTrack
  }
})

export const GraphQLEmbedBlock = new GraphQLObjectType<EmbedBlock, Context>({
  name: 'EmbedBlock',
  fields: {
    url: {type: GraphQLString},
    title: {type: GraphQLString},
    width: {type: GraphQLInt},
    height: {type: GraphQLInt}
  },
  isTypeOf(value) {
    return value.type === BlockType.Embed
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
    listicle: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLListicleItem)))}
  },
  isTypeOf(value) {
    return value.type === BlockType.Listicle
  }
})

export const GraphQLLinkPageBreakBlock = new GraphQLObjectType<LinkPageBreakBlock, Context>({
  name: 'LinkPageBreakBlock',
  fields: {
    text: {type: GraphQLNonNull(GraphQLString)},
    linkURL: {type: GraphQLNonNull(GraphQLString)},
    linkText: {type: GraphQLNonNull(GraphQLString)}
  },
  isTypeOf(value) {
    return value.type === BlockType.LinkPageBreak
  }
})

export const GraphQLTitleBlock = new GraphQLObjectType<TitleBlock, Context>({
  name: 'TitleBlock',
  fields: {
    title: {type: GraphQLString},
    lead: {type: GraphQLString}
  },
  isTypeOf(value) {
    return value.type === BlockType.Title
  }
})

export const GraphQLQuoteBlock = new GraphQLObjectType<QuoteBlock, Context>({
  name: 'QuoteBlock',
  fields: {
    quote: {type: GraphQLString},
    author: {type: GraphQLString}
  },
  isTypeOf(value) {
    return value.type === BlockType.Quote
  }
})

export const GraphQLInputRichTextBlock = new GraphQLInputObjectType({
  name: 'InputRichTextBlock',
  fields: {
    richText: {
      type: GraphQLNonNull(GraphQLRichText)
    }
  }
})

export const GraphQLInputTitleBlock = new GraphQLInputObjectType({
  name: 'InputTitleBlock',
  fields: {
    title: {type: GraphQLString},
    lead: {type: GraphQLString}
  }
})

export const GraphQLInputImageBlock = new GraphQLInputObjectType({
  name: 'InputImageBlock',
  fields: {
    caption: {type: GraphQLString},
    imageID: {type: GraphQLID}
  }
})

export const GraphQLInputQuoteBlock = new GraphQLInputObjectType({
  name: 'InputQuoteBlock',
  fields: {
    quote: {type: GraphQLString},
    author: {type: GraphQLString}
  }
})

export const GraphQLInputFacebookPostBlock = new GraphQLInputObjectType({
  name: 'InputFacebookPostBlock',
  fields: {
    userID: {type: GraphQLNonNull(GraphQLString)},
    postID: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLInputInstagramPostBlock = new GraphQLInputObjectType({
  name: 'InputInstagramPostBlock',
  fields: {
    postID: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLInputTwitterTweetBlock = new GraphQLInputObjectType({
  name: 'InputTwitterTweetBlock',
  fields: {
    userID: {type: GraphQLNonNull(GraphQLString)},
    tweetID: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLInputVimeoVideoBlock = new GraphQLInputObjectType({
  name: 'InputVimeoVideoBlock',
  fields: {
    videoID: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLInputYouTubeVideoBlock = new GraphQLInputObjectType({
  name: 'InputYouTubeVideoBlock',
  fields: {
    videoID: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLInputSoundCloudTrackBlock = new GraphQLInputObjectType({
  name: 'InputSoundCloudTrackBlock',
  fields: {
    trackID: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLInputEmbedBlock = new GraphQLInputObjectType({
  name: 'InputEmbedBlock',
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
    type: {type: GraphQLString},
    articleID: {type: GraphQLID}
  }
})

export const GraphQLArticleTeaserGridBlockInput = new GraphQLInputObjectType({
  name: 'ArticleTeaserGridBlockInput',
  fields: {
    teasers: {type: GraphQLNonNull(GraphQLList(GraphQLArticleTeaserInput))},
    numColumns: {type: GraphQLNonNull(GraphQLInt)}
  }
})
