import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType
} from 'graphql'

import {GraphQLImage} from './image'
import {GraphQLRichText} from '@wepublish/richtext/api'

import {Context} from '../context'

import {
  ArticleTeaser,
  BildwurfAdBlock,
  BlockType,
  CommentBlock,
  CustomTeaser,
  EmbedBlock,
  FacebookPostBlock,
  FacebookVideoBlock,
  FlexAlignment,
  FlexTeaser,
  HTMLBlock,
  ImageBlock,
  ImageCaptionEdge,
  ImageGalleryBlock,
  InstagramPostBlock,
  LinkPageBreakBlock,
  ListicleBlock,
  ListicleItem,
  PageTeaser,
  EventTeaser,
  PeerArticleTeaser,
  PolisConversationBlock,
  PollBlock,
  EventBlock,
  QuoteBlock,
  RichTextBlock,
  SoundCloudTrackBlock,
  TeaserGridBlock,
  TeaserGridFlexBlock,
  TeaserStyle,
  TeaserType,
  TikTokVideoBlock,
  TitleBlock,
  TwitterTweetBlock,
  VimeoVideoBlock,
  YouTubeVideoBlock
} from '../db/block'

import {createProxyingIsTypeOf, createProxyingResolver, delegateToPeerSchema} from '../utility'
import {GraphQLArticle, GraphQLPublicArticle} from './article'
import {GraphQLPage, GraphQLPublicPage} from './page'
import {GraphQLPeer} from './peer'
import {GraphQLFullPoll} from './poll/poll'

import {GraphQLComment, GraphQLPublicComment} from './comment/comment'
import {
  GraphQLMetadataProperty,
  GraphQLMetadataPropertyInput,
  GraphQLMetadataPropertyPublic
} from './common'
import {GraphQLEvent} from './event/event'

export const GraphQLTeaserStyle = new GraphQLEnumType({
  name: 'TeaserStyle',
  values: {
    DEFAULT: {value: TeaserStyle.Default},
    LIGHT: {value: TeaserStyle.Light},
    TEXT: {value: TeaserStyle.Text}
  }
})

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
      resolve: createProxyingResolver(({imageID}, _, {loaders}) =>
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
      resolve: createProxyingResolver(({imageID}, _, {loaders}) =>
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
      resolve: createProxyingResolver(({imageID}, _, {loaders}) =>
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

export const GraphQLEventTeaser = new GraphQLObjectType<EventTeaser, Context>({
  name: 'EventTeaser',
  fields: () => ({
    style: {type: GraphQLNonNull(GraphQLTeaserStyle)},

    image: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({imageID}, _, {loaders}) =>
        imageID ? loaders.images.load(imageID) : null
      )
    },

    preTitle: {type: GraphQLString},
    title: {type: GraphQLString},
    lead: {type: GraphQLString},

    event: {
      type: GraphQLEvent,
      resolve: createProxyingResolver(({eventID}, args, {loaders}) => {
        return loaders.eventById.load(eventID)
      })
    }
  }),

  isTypeOf: createProxyingIsTypeOf(value => value.type === TeaserType.Event)
})

export const GraphQLCustomTeaser = new GraphQLObjectType<CustomTeaser, Context>({
  name: 'CustomTeaser',
  fields: () => ({
    style: {type: GraphQLNonNull(GraphQLTeaserStyle)},

    image: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({imageID}, _, {loaders}) =>
        imageID ? loaders.images.load(imageID) : null
      )
    },

    preTitle: {type: GraphQLString},
    title: {type: GraphQLString},
    lead: {type: GraphQLString},
    contentUrl: {type: GraphQLString},
    properties: {type: GraphQLList(GraphQLNonNull(GraphQLMetadataProperty))}
  }),

  isTypeOf: createProxyingIsTypeOf(value => value.type === TeaserType.Custom)
})

export const GraphQLTeaser = new GraphQLUnionType({
  name: 'Teaser',
  types: [
    GraphQLArticleTeaser,
    GraphQLPeerArticleTeaser,
    GraphQLPageTeaser,
    GraphQLCustomTeaser,
    GraphQLEventTeaser
  ]
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

export const GraphQLFlexGridAlignment = new GraphQLObjectType<FlexAlignment, Context>({
  name: 'FlexAlignment',
  fields: {
    i: {type: GraphQLNonNull(GraphQLString)},
    x: {type: GraphQLNonNull(GraphQLInt)},
    y: {type: GraphQLNonNull(GraphQLInt)},
    w: {type: GraphQLNonNull(GraphQLInt)},
    h: {type: GraphQLNonNull(GraphQLInt)},
    static: {type: GraphQLNonNull(GraphQLBoolean)}
  }
})

export const GraphQLFlexGridAlignmentInput = new GraphQLInputObjectType({
  name: 'FlexAlignmentInput',
  fields: {
    i: {type: GraphQLNonNull(GraphQLString)},
    x: {type: GraphQLNonNull(GraphQLInt)},
    y: {type: GraphQLNonNull(GraphQLInt)},
    w: {type: GraphQLNonNull(GraphQLInt)},
    h: {type: GraphQLNonNull(GraphQLInt)},
    static: {type: GraphQLNonNull(GraphQLBoolean)}
  }
})

export const GraphQLFlexTeaser = new GraphQLObjectType<FlexTeaser, Context>({
  name: 'FlexTeaser',
  fields: {
    alignment: {type: GraphQLNonNull(GraphQLFlexGridAlignment)},
    teaser: {type: GraphQLTeaser}
  }
})

export const GraphQLTeaserGridFlexBlock = new GraphQLObjectType<TeaserGridFlexBlock, Context>({
  name: 'TeaserGridFlexBlock',
  fields: {
    flexTeasers: {type: GraphQLNonNull(GraphQLList(GraphQLFlexTeaser))}
  },
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === BlockType.TeaserGridFlex
  })
})

export const GraphQLPublicArticleTeaser = new GraphQLObjectType<ArticleTeaser, Context>({
  name: 'ArticleTeaser',
  fields: () => ({
    style: {type: GraphQLNonNull(GraphQLTeaserStyle)},

    image: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({imageID}, _, {loaders}) =>
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
      resolve: createProxyingResolver(({imageID}, _, {loaders}) =>
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
      resolve: createProxyingResolver(({imageID}, _, {loaders}) =>
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

export const GraphQLPublicEventTeaser = new GraphQLObjectType<EventTeaser, Context>({
  name: 'EventTeaser',
  fields: () => ({
    style: {type: GraphQLNonNull(GraphQLTeaserStyle)},

    image: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({imageID}, _, {loaders}) =>
        imageID ? loaders.images.load(imageID) : null
      )
    },

    preTitle: {type: GraphQLString},
    title: {type: GraphQLString},
    lead: {type: GraphQLString},

    event: {
      type: GraphQLEvent,
      resolve: createProxyingResolver(({eventID}, args, {loaders}) => {
        return loaders.eventById.load(eventID)
      })
    }
  }),
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === TeaserType.Event
  })
})

export const GraphQLPublicCustomTeaser = new GraphQLObjectType<CustomTeaser, Context>({
  name: 'CustomTeaser',
  fields: () => ({
    style: {type: GraphQLNonNull(GraphQLTeaserStyle)},

    image: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({imageID}, _, {loaders}) =>
        imageID ? loaders.images.load(imageID) : null
      )
    },

    preTitle: {type: GraphQLString},
    title: {type: GraphQLString},
    lead: {type: GraphQLString},
    contentUrl: {type: GraphQLString},
    properties: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLMetadataPropertyPublic)))}
  }),

  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === TeaserType.Custom
  })
})

export const GraphQLPublicTeaser = new GraphQLUnionType({
  name: 'Teaser',
  types: [
    GraphQLPublicArticleTeaser,
    GraphQLPublicPeerArticleTeaser,
    GraphQLPublicPageTeaser,
    GraphQLPublicEventTeaser,
    GraphQLPublicCustomTeaser
  ]
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

export const GraphQLPublicFlexAlignment = new GraphQLObjectType<FlexAlignment, Context>({
  name: 'FlexAlignment',
  fields: {
    x: {type: GraphQLNonNull(GraphQLInt)},
    y: {type: GraphQLNonNull(GraphQLInt)},
    w: {type: GraphQLNonNull(GraphQLInt)},
    h: {type: GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLPublicFlexTeaser = new GraphQLObjectType<FlexTeaser, Context>({
  name: 'FlexTeaser',
  fields: {
    alignment: {type: GraphQLNonNull(GraphQLPublicFlexAlignment)},
    teaser: {type: GraphQLPublicTeaser}
  }
})

export const GraphQLPublicTeaserGridFlexBlock = new GraphQLObjectType<TeaserGridFlexBlock, Context>(
  {
    name: 'TeaserGridFlexBlock',
    fields: {
      flexTeasers: {
        type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPublicFlexTeaser)))
      }
    },
    isTypeOf: createProxyingIsTypeOf(value => {
      return value.type === BlockType.TeaserGridFlex
    })
  }
)

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

export const GraphQLPolisConversationBlock = new GraphQLObjectType<PolisConversationBlock, Context>(
  {
    name: 'PolisConversationBlock',
    fields: {
      conversationID: {type: GraphQLNonNull(GraphQLString)}
    },
    isTypeOf: createProxyingIsTypeOf(value => {
      return value.type === BlockType.PolisConversation
    })
  }
)

export const GraphQLTikTokVideoBlock = new GraphQLObjectType<TikTokVideoBlock, Context>({
  name: 'TikTokVideoBlock',
  fields: {
    videoID: {type: GraphQLNonNull(GraphQLString)},
    userID: {type: GraphQLNonNull(GraphQLString)}
  },
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === BlockType.TikTokVideo
  })
})

export const GraphQLBildwurfAdBlock = new GraphQLObjectType<BildwurfAdBlock, Context>({
  name: 'BildwurfAdBlock',
  fields: {
    zoneID: {type: GraphQLNonNull(GraphQLString)}
  },
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === BlockType.BildwurfAd
  })
})

export const GraphQLHTMLBlock = new GraphQLObjectType<HTMLBlock, Context>({
  name: 'HTMLBlock',
  fields: {
    html: {type: GraphQLString}
  },
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === BlockType.HTML
  })
})

export const GraphQLPollBlock = new GraphQLObjectType<PollBlock, Context>({
  name: 'PollBlock',
  fields: {
    poll: {
      type: GraphQLFullPoll,
      resolve: ({pollId}, _, {loaders: {pollById}}) => pollById.load(pollId)
    }
  },
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === BlockType.Poll
  })
})

export const GraphQLEventBlockFilter = new GraphQLObjectType({
  name: 'EventBlockFilter',
  fields: {
    tags: {type: GraphQLList(GraphQLNonNull(GraphQLID))},
    events: {type: GraphQLList(GraphQLNonNull(GraphQLID))}
  }
})

export const GraphQLEventBlock = new GraphQLObjectType<EventBlock, Context>({
  name: 'EventBlock',
  fields: {
    filter: {type: GraphQLNonNull(GraphQLEventBlockFilter)},
    events: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLEvent))),
      resolve: ({filter}, _, {prisma}) =>
        prisma.event.findMany({
          where: {
            OR: [
              {
                tags: {
                  some: {
                    tagId: {
                      in: filter.tags ?? []
                    }
                  }
                }
              },
              {
                id: {
                  in: filter.events ?? []
                }
              }
            ]
          }
        })
    }
  },
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === BlockType.Event
  })
})

export const GraphQLCommentBlockFilter = new GraphQLObjectType({
  name: 'CommentBlockFilter',
  fields: {
    item: {type: GraphQLID},
    tags: {type: GraphQLList(GraphQLNonNull(GraphQLID))},
    comments: {type: GraphQLList(GraphQLNonNull(GraphQLID))}
  }
})

export const GraphQLCommentBlock = new GraphQLObjectType<CommentBlock, Context>({
  name: 'CommentBlock',
  fields: {
    filter: {type: GraphQLNonNull(GraphQLCommentBlockFilter)},
    comments: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLComment))),
      resolve: async ({filter}, _, {prisma}) =>
        prisma.comment.findMany({
          where: {
            itemID: filter.item ?? '',
            OR: [
              {
                tags: {
                  some: {
                    tagId: {
                      in: filter.tags ?? []
                    }
                  }
                }
              },
              {
                id: {
                  in: filter.comments ?? []
                }
              }
            ]
          },
          include: {
            revisions: {orderBy: {createdAt: 'asc'}}
          }
        })
    }
  },
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === BlockType.Comment
  })
})

export const GraphQLPublicCommentBlock = new GraphQLObjectType<CommentBlock, Context>({
  name: 'CommentBlock',
  fields: {
    comments: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPublicComment))),
      resolve: async ({filter}, _, {prisma}) => {
        const comments = await prisma.comment.findMany({
          where: {
            itemID: filter.item ?? undefined,
            OR: [
              {
                tags: {
                  some: {
                    tagId: {
                      in: filter.tags ?? []
                    }
                  }
                }
              },
              {
                id: {
                  in: filter.comments ?? []
                }
              }
            ]
          },
          include: {
            revisions: {orderBy: {createdAt: 'asc'}},
            overriddenRatings: true
          }
        })

        return comments.map(({revisions, ...comment}) => ({
          text: revisions[revisions.length - 1].text,
          ...comment
        }))
      }
    }
  },
  isTypeOf: createProxyingIsTypeOf(value => {
    return value.type === BlockType.Comment
  })
})

export const GraphQLEmbedBlock = new GraphQLObjectType<EmbedBlock, Context>({
  name: 'EmbedBlock',
  fields: {
    url: {type: GraphQLString},
    title: {type: GraphQLString},
    width: {type: GraphQLInt},
    height: {type: GraphQLInt},
    styleCustom: {type: GraphQLString},
    sandbox: {type: GraphQLString}
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
    richText: {type: GraphQLNonNull(GraphQLRichText)},
    linkURL: {type: GraphQLString},
    linkText: {type: GraphQLString},
    linkTarget: {type: GraphQLString},
    hideButton: {type: GraphQLNonNull(GraphQLBoolean)},
    styleOption: {type: GraphQLString},
    layoutOption: {type: GraphQLString},
    templateOption: {type: GraphQLString},
    image: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({imageID}, _args, {loaders}) => {
        return imageID ? loaders.images.load(imageID) : null
      })
    }
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
    richText: {type: GraphQLNonNull(GraphQLRichText)},
    linkURL: {type: GraphQLString},
    linkText: {type: GraphQLString},
    linkTarget: {type: GraphQLString},
    hideButton: {type: GraphQLNonNull(GraphQLBoolean)},
    styleOption: {type: GraphQLString},
    templateOption: {type: GraphQLString},
    layoutOption: {type: GraphQLString},
    imageID: {type: GraphQLID}
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

export const GraphQLPolisConversationBlockInput = new GraphQLInputObjectType({
  name: 'PolisConversationBlockInput',
  fields: {
    conversationID: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLTikTokVideoBlockInput = new GraphQLInputObjectType({
  name: 'TikTokVideoBlockInput',
  fields: {
    videoID: {type: GraphQLNonNull(GraphQLString)},
    userID: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLBildwurfAdBlockInput = new GraphQLInputObjectType({
  name: 'BildwurfAdBlockInput',
  fields: {
    zoneID: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLEmbedBlockInput = new GraphQLInputObjectType({
  name: 'EmbedBlockInput',
  fields: {
    url: {type: GraphQLString},
    title: {type: GraphQLString},
    width: {type: GraphQLInt},
    height: {type: GraphQLInt},
    styleCustom: {type: GraphQLString},
    sandbox: {type: GraphQLString}
  }
})

export const GraphQLHTMLBlockInput = new GraphQLInputObjectType({
  name: 'HTMLBlockInput',
  fields: {
    html: {type: GraphQLString}
  }
})

export const GraphQLPollBlockInput = new GraphQLInputObjectType({
  name: 'PollBlockInput',
  fields: {
    pollId: {type: GraphQLID}
  }
})

export const GraphQLEventBlockInputFilter = new GraphQLInputObjectType({
  name: 'EventBlockInputFilter',
  fields: {
    tags: {type: GraphQLList(GraphQLNonNull(GraphQLID))},
    events: {type: GraphQLList(GraphQLNonNull(GraphQLID))}
  }
})

export const GraphQLEventBlockInput = new GraphQLInputObjectType({
  name: 'EventBlockInput',
  fields: {
    filter: {type: GraphQLNonNull(GraphQLEventBlockInputFilter)}
  }
})

export const GraphQLCommentBlockInputFilter = new GraphQLInputObjectType({
  name: 'CommentBlockInputFilter',
  fields: {
    item: {type: GraphQLID},
    tags: {type: GraphQLList(GraphQLNonNull(GraphQLID))},
    comments: {type: GraphQLList(GraphQLNonNull(GraphQLID))}
  }
})

export const GraphQLCommentBlockInput = new GraphQLInputObjectType({
  name: 'CommentBlockInput',
  fields: {
    filter: {type: GraphQLNonNull(GraphQLCommentBlockInputFilter)}
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

export const GraphQLEventTeaserInput = new GraphQLInputObjectType({
  name: 'EventTeaserInput',
  fields: {
    style: {type: GraphQLNonNull(GraphQLTeaserStyle)},
    imageID: {type: GraphQLID},
    preTitle: {type: GraphQLString},
    title: {type: GraphQLString},
    lead: {type: GraphQLString},
    eventID: {type: GraphQLNonNull(GraphQLID)}
  }
})

export const GraphQLCustomTeaserInput = new GraphQLInputObjectType({
  name: 'CustomTeaserInput',
  fields: {
    style: {type: GraphQLNonNull(GraphQLTeaserStyle)},
    imageID: {type: GraphQLID},
    preTitle: {type: GraphQLString},
    title: {type: GraphQLString},
    lead: {type: GraphQLString},
    contentUrl: {type: GraphQLString},
    properties: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLMetadataPropertyInput)))}
  }
})

export const GraphQLTeaserInput = new GraphQLInputObjectType({
  name: 'TeaserInput',
  fields: () => ({
    [TeaserType.Article]: {type: GraphQLArticleTeaserInput},
    [TeaserType.PeerArticle]: {type: GraphQLPeerArticleTeaserInput},
    [TeaserType.Page]: {type: GraphQLPageTeaserInput},
    [TeaserType.Event]: {type: GraphQLEventTeaserInput},
    [TeaserType.Custom]: {type: GraphQLCustomTeaserInput}
  })
})

export const GraphQLTeaserGridBlockInput = new GraphQLInputObjectType({
  name: 'TeaserGridBlockInput',
  fields: {
    teasers: {type: GraphQLNonNull(GraphQLList(GraphQLTeaserInput))},
    numColumns: {type: GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLFlexTeaserInput = new GraphQLInputObjectType({
  name: 'FlexTeaserInput',
  fields: {
    teaser: {type: GraphQLTeaserInput},
    alignment: {type: GraphQLNonNull(GraphQLFlexGridAlignmentInput)}
  }
})

export const GraphQLTeaserGridFlexBlockInput = new GraphQLInputObjectType({
  name: 'TeaserGridFlexBlockInput',
  fields: {
    flexTeasers: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLFlexTeaserInput)))}
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
    [BlockType.PolisConversation]: {type: GraphQLPolisConversationBlockInput},
    [BlockType.TikTokVideo]: {type: GraphQLTikTokVideoBlockInput},
    [BlockType.BildwurfAd]: {type: GraphQLBildwurfAdBlockInput},
    [BlockType.Embed]: {type: GraphQLEmbedBlockInput},
    [BlockType.HTML]: {type: GraphQLHTMLBlockInput},
    [BlockType.Poll]: {type: GraphQLPollBlockInput},
    [BlockType.Event]: {type: GraphQLEventBlockInput},
    [BlockType.Comment]: {type: GraphQLCommentBlockInput},
    [BlockType.LinkPageBreak]: {type: GraphQLLinkPageBreakBlockInput},
    [BlockType.TeaserGrid]: {type: GraphQLTeaserGridBlockInput},
    [BlockType.TeaserGridFlex]: {type: GraphQLTeaserGridFlexBlockInput}
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
    GraphQLPolisConversationBlock,
    GraphQLTikTokVideoBlock,
    GraphQLBildwurfAdBlock,
    GraphQLEmbedBlock,
    GraphQLHTMLBlock,
    GraphQLPollBlock,
    GraphQLEventBlock,
    GraphQLCommentBlock,
    GraphQLLinkPageBreakBlock,
    GraphQLTitleBlock,
    GraphQLQuoteBlock,
    GraphQLTeaserGridBlock,
    GraphQLTeaserGridFlexBlock
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
    GraphQLFacebookVideoBlock,
    GraphQLInstagramPostBlock,
    GraphQLTwitterTweetBlock,
    GraphQLVimeoVideoBlock,
    GraphQLYouTubeVideoBlock,
    GraphQLSoundCloudTrackBlock,
    GraphQLPolisConversationBlock,
    GraphQLTikTokVideoBlock,
    GraphQLBildwurfAdBlock,
    GraphQLEmbedBlock,
    GraphQLHTMLBlock,
    GraphQLPollBlock,
    GraphQLEventBlock,
    GraphQLPublicCommentBlock,
    GraphQLLinkPageBreakBlock,
    GraphQLTitleBlock,
    GraphQLQuoteBlock,
    GraphQLPublicTeaserGridBlock,
    GraphQLPublicTeaserGridFlexBlock
  ]
})
