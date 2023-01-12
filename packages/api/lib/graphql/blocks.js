"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLImageGalleryBlockInput = exports.GraphQLGalleryImageEdgeInput = exports.GraphQLImageBlockInput = exports.GraphQLTitleBlockInput = exports.GraphQLRichTextBlockInput = exports.GraphQLQuoteBlock = exports.GraphQLTitleBlock = exports.GraphQLLinkPageBreakBlock = exports.GraphQLListicleBlock = exports.GraphQLListicleItem = exports.GraphQLEmbedBlock = exports.GraphQLPublicCommentBlock = exports.GraphQLCommentBlock = exports.GraphQLCommentBlockFilter = exports.GraphQLPollBlock = exports.GraphQLHTMLBlock = exports.GraphQLBildwurfAdBlock = exports.GraphQLTikTokVideoBlock = exports.GraphQLPolisConversationBlock = exports.GraphQLSoundCloudTrackBlock = exports.GraphQLYouTubeVideoBlock = exports.GraphQLVimeoVideoBlock = exports.GraphQLTwitterTweetBlock = exports.GraphQLInstagramPostBlock = exports.GraphQLFacebookVideoBlock = exports.GraphQLFacebookPostBlock = exports.GraphQLImageGalleryBlock = exports.GraphQLImageBlock = exports.GraphQLGalleryImageEdge = exports.GraphQLPublicTeaserGridFlexBlock = exports.GraphQLPublicFlexTeaser = exports.GraphQLPublicFlexAlignment = exports.GraphQLPublicTeaserGridBlock = exports.GraphQLPublicTeaser = exports.GraphQLPublicCustomTeaser = exports.GraphQLPublicPageTeaser = exports.GraphQLPublicPeerArticleTeaser = exports.GraphQLPublicArticleTeaser = exports.GraphQLTeaserGridFlexBlock = exports.GraphQLFlexTeaser = exports.GraphQLFlexGridAlignmentInput = exports.GraphQLFlexGridAlignment = exports.GraphQLTeaserGridBlock = exports.GraphQLTeaser = exports.GraphQLCustomTeaser = exports.GraphQLPageTeaser = exports.GraphQLPeerArticleTeaser = exports.GraphQLArticleTeaser = exports.GraphQLRichTextBlock = exports.GraphQLTeaserStyle = void 0;
exports.GraphQLPublicBlock = exports.GraphQLBlock = exports.GraphQLBlockInput = exports.GraphQLTeaserGridFlexBlockInput = exports.GraphQLFlexTeaserInput = exports.GraphQLTeaserGridBlockInput = exports.GraphQLTeaserInput = exports.GraphQLCustomTeaserInput = exports.GraphQLPageTeaserInput = exports.GraphQLPeerArticleTeaserInput = exports.GraphQLArticleTeaserInput = exports.GraphQLCommentBlockInput = exports.GraphQLCommentBlockInputFilter = exports.GraphQLPollBlockInput = exports.GraphQLHTMLBlockInput = exports.GraphQLEmbedBlockInput = exports.GraphQLBildwurfAdBlockInput = exports.GraphQLTikTokVideoBlockInput = exports.GraphQLPolisConversationBlockInput = exports.GraphQLSoundCloudTrackBlockInput = exports.GraphQLYouTubeVideoBlockInput = exports.GraphQLVimeoVideoBlockInput = exports.GraphQLTwitterTweetBlockInput = exports.GraphQLInstagramPostBlockInput = exports.GraphQLFacebookVideoBlockInput = exports.GraphQLFacebookPostBlockInput = exports.GraphQLLinkPageBreakBlockInput = exports.GraphQLQuoteBlockInput = exports.GraphQLListicleBlockInput = exports.GraphQLListicleItemInput = void 0;
const graphql_1 = require("graphql");
const image_1 = require("./image");
const richText_1 = require("./richText");
const block_1 = require("../db/block");
const utility_1 = require("../utility");
const article_1 = require("./article");
const page_1 = require("./page");
const peer_1 = require("./peer");
const poll_1 = require("./poll/poll");
const comment_1 = require("./comment/comment");
const common_1 = require("./common");
exports.GraphQLTeaserStyle = new graphql_1.GraphQLEnumType({
    name: 'TeaserStyle',
    values: {
        DEFAULT: { value: block_1.TeaserStyle.Default },
        LIGHT: { value: block_1.TeaserStyle.Light },
        TEXT: { value: block_1.TeaserStyle.Text }
    }
});
exports.GraphQLRichTextBlock = new graphql_1.GraphQLObjectType({
    name: 'RichTextBlock',
    fields: {
        richText: { type: (0, graphql_1.GraphQLNonNull)(richText_1.GraphQLRichText) }
    },
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === block_1.BlockType.RichText;
    })
});
exports.GraphQLArticleTeaser = new graphql_1.GraphQLObjectType({
    name: 'ArticleTeaser',
    fields: () => ({
        style: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLTeaserStyle) },
        image: {
            type: image_1.GraphQLImage,
            resolve: (0, utility_1.createProxyingResolver)(({ imageID }, {}, { loaders }) => imageID ? loaders.images.load(imageID) : null)
        },
        preTitle: { type: graphql_1.GraphQLString },
        title: { type: graphql_1.GraphQLString },
        lead: { type: graphql_1.GraphQLString },
        article: {
            type: article_1.GraphQLArticle,
            resolve: (0, utility_1.createProxyingResolver)(({ articleID }, args, { loaders }) => {
                return loaders.articles.load(articleID);
            })
        }
    }),
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => value.type === block_1.TeaserType.Article)
});
exports.GraphQLPeerArticleTeaser = new graphql_1.GraphQLObjectType({
    name: 'PeerArticleTeaser',
    fields: () => ({
        style: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLTeaserStyle) },
        image: {
            type: image_1.GraphQLImage,
            resolve: (0, utility_1.createProxyingResolver)(({ imageID }, {}, { loaders }) => imageID ? loaders.images.load(imageID) : null)
        },
        preTitle: { type: graphql_1.GraphQLString },
        title: { type: graphql_1.GraphQLString },
        lead: { type: graphql_1.GraphQLString },
        peer: {
            type: peer_1.GraphQLPeer,
            resolve: (0, utility_1.createProxyingResolver)(({ peerID }, args, { loaders }) => {
                return loaders.peer.load(peerID);
            })
        },
        articleID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        article: {
            type: article_1.GraphQLArticle,
            resolve: (0, utility_1.createProxyingResolver)(async ({ peerID, articleID }, args, context, info) => {
                return (0, utility_1.delegateToPeerSchema)(peerID, true, context, {
                    fieldName: 'article',
                    args: { id: articleID },
                    info
                });
            })
        }
    }),
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => value.type === block_1.TeaserType.PeerArticle)
});
exports.GraphQLPageTeaser = new graphql_1.GraphQLObjectType({
    name: 'PageTeaser',
    fields: () => ({
        style: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLTeaserStyle) },
        image: {
            type: image_1.GraphQLImage,
            resolve: (0, utility_1.createProxyingResolver)(({ imageID }, {}, { loaders }) => imageID ? loaders.images.load(imageID) : null)
        },
        preTitle: { type: graphql_1.GraphQLString },
        title: { type: graphql_1.GraphQLString },
        lead: { type: graphql_1.GraphQLString },
        page: {
            type: page_1.GraphQLPage,
            resolve: (0, utility_1.createProxyingResolver)(({ pageID }, args, { loaders }) => {
                return loaders.pages.load(pageID);
            })
        }
    }),
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => value.type === block_1.TeaserType.Page)
});
exports.GraphQLCustomTeaser = new graphql_1.GraphQLObjectType({
    name: 'CustomTeaser',
    fields: () => ({
        style: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLTeaserStyle) },
        image: {
            type: image_1.GraphQLImage,
            resolve: (0, utility_1.createProxyingResolver)(({ imageID }, {}, { loaders }) => imageID ? loaders.images.load(imageID) : null)
        },
        preTitle: { type: graphql_1.GraphQLString },
        title: { type: graphql_1.GraphQLString },
        lead: { type: graphql_1.GraphQLString },
        contentUrl: { type: graphql_1.GraphQLString },
        properties: { type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(common_1.GraphQLMetadataProperty)) }
    }),
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => value.type === block_1.TeaserType.Custom)
});
exports.GraphQLTeaser = new graphql_1.GraphQLUnionType({
    name: 'Teaser',
    types: [exports.GraphQLArticleTeaser, exports.GraphQLPeerArticleTeaser, exports.GraphQLPageTeaser, exports.GraphQLCustomTeaser]
});
exports.GraphQLTeaserGridBlock = new graphql_1.GraphQLObjectType({
    name: 'TeaserGridBlock',
    fields: {
        teasers: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)(exports.GraphQLTeaser)) },
        numColumns: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) }
    },
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === block_1.BlockType.TeaserGrid;
    })
});
exports.GraphQLFlexGridAlignment = new graphql_1.GraphQLObjectType({
    name: 'FlexAlignment',
    fields: {
        i: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        x: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
        y: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
        w: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
        h: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
        static: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) }
    }
});
exports.GraphQLFlexGridAlignmentInput = new graphql_1.GraphQLInputObjectType({
    name: 'FlexAlignmentInput',
    fields: {
        i: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        x: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
        y: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
        w: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
        h: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
        static: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) }
    }
});
exports.GraphQLFlexTeaser = new graphql_1.GraphQLObjectType({
    name: 'FlexTeaser',
    fields: {
        alignment: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLFlexGridAlignment) },
        teaser: { type: exports.GraphQLTeaser }
    }
});
exports.GraphQLTeaserGridFlexBlock = new graphql_1.GraphQLObjectType({
    name: 'TeaserGridFlexBlock',
    fields: {
        flexTeasers: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)(exports.GraphQLFlexTeaser)) }
    },
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === block_1.BlockType.TeaserGridFlex;
    })
});
exports.GraphQLPublicArticleTeaser = new graphql_1.GraphQLObjectType({
    name: 'ArticleTeaser',
    fields: () => ({
        style: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLTeaserStyle) },
        image: {
            type: image_1.GraphQLImage,
            resolve: (0, utility_1.createProxyingResolver)(({ imageID }, {}, { loaders }) => imageID ? loaders.images.load(imageID) : null)
        },
        preTitle: { type: graphql_1.GraphQLString },
        title: { type: graphql_1.GraphQLString },
        lead: { type: graphql_1.GraphQLString },
        article: {
            type: article_1.GraphQLPublicArticle,
            resolve: (0, utility_1.createProxyingResolver)(({ articleID }, args, { loaders }) => {
                return loaders.publicArticles.load(articleID);
            })
        }
    }),
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === block_1.TeaserType.Article;
    })
});
exports.GraphQLPublicPeerArticleTeaser = new graphql_1.GraphQLObjectType({
    name: 'PeerArticleTeaser',
    fields: () => ({
        style: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLTeaserStyle) },
        image: {
            type: image_1.GraphQLImage,
            resolve: (0, utility_1.createProxyingResolver)(({ imageID }, {}, { loaders }) => imageID ? loaders.images.load(imageID) : null)
        },
        preTitle: { type: graphql_1.GraphQLString },
        title: { type: graphql_1.GraphQLString },
        lead: { type: graphql_1.GraphQLString },
        peer: {
            type: peer_1.GraphQLPeer,
            resolve: (0, utility_1.createProxyingResolver)(({ peerID }, args, { loaders }) => {
                return loaders.peer.load(peerID);
            })
        },
        articleID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        article: {
            type: article_1.GraphQLPublicArticle,
            resolve: (0, utility_1.createProxyingResolver)(({ peerID, articleID }, args, context, info) => {
                return (0, utility_1.delegateToPeerSchema)(peerID, false, context, {
                    fieldName: 'article',
                    args: { id: articleID },
                    info
                });
            })
        }
    }),
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === block_1.TeaserType.PeerArticle;
    })
});
exports.GraphQLPublicPageTeaser = new graphql_1.GraphQLObjectType({
    name: 'PageTeaser',
    fields: () => ({
        style: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLTeaserStyle) },
        image: {
            type: image_1.GraphQLImage,
            resolve: (0, utility_1.createProxyingResolver)(({ imageID }, {}, { loaders }) => imageID ? loaders.images.load(imageID) : null)
        },
        preTitle: { type: graphql_1.GraphQLString },
        title: { type: graphql_1.GraphQLString },
        lead: { type: graphql_1.GraphQLString },
        page: {
            type: page_1.GraphQLPublicPage,
            resolve: (0, utility_1.createProxyingResolver)(({ pageID }, args, { loaders }) => {
                return loaders.publicPagesByID.load(pageID);
            })
        }
    }),
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === block_1.TeaserType.Page;
    })
});
exports.GraphQLPublicCustomTeaser = new graphql_1.GraphQLObjectType({
    name: 'CustomTeaser',
    fields: () => ({
        style: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLTeaserStyle) },
        image: {
            type: image_1.GraphQLImage,
            resolve: (0, utility_1.createProxyingResolver)(({ imageID }, {}, { loaders }) => imageID ? loaders.images.load(imageID) : null)
        },
        preTitle: { type: graphql_1.GraphQLString },
        title: { type: graphql_1.GraphQLString },
        lead: { type: graphql_1.GraphQLString },
        contentUrl: { type: graphql_1.GraphQLString },
        properties: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(common_1.GraphQLMetadataPropertyPublic))) }
    }),
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === block_1.TeaserType.Custom;
    })
});
exports.GraphQLPublicTeaser = new graphql_1.GraphQLUnionType({
    name: 'Teaser',
    types: [
        exports.GraphQLPublicArticleTeaser,
        exports.GraphQLPublicPeerArticleTeaser,
        exports.GraphQLPublicPageTeaser,
        exports.GraphQLPublicCustomTeaser
    ]
});
exports.GraphQLPublicTeaserGridBlock = new graphql_1.GraphQLObjectType({
    name: 'TeaserGridBlock',
    fields: {
        teasers: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)(exports.GraphQLPublicTeaser)) },
        numColumns: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) }
    },
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === block_1.BlockType.TeaserGrid;
    })
});
exports.GraphQLPublicFlexAlignment = new graphql_1.GraphQLObjectType({
    name: 'FlexAlignment',
    fields: {
        x: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
        y: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
        w: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
        h: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) }
    }
});
exports.GraphQLPublicFlexTeaser = new graphql_1.GraphQLObjectType({
    name: 'FlexTeaser',
    fields: {
        alignment: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLPublicFlexAlignment) },
        teaser: { type: exports.GraphQLPublicTeaser }
    }
});
exports.GraphQLPublicTeaserGridFlexBlock = new graphql_1.GraphQLObjectType({
    name: 'TeaserGridFlexBlock',
    fields: {
        flexTeasers: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLPublicFlexTeaser)))
        }
    },
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === block_1.BlockType.TeaserGridFlex;
    })
});
exports.GraphQLGalleryImageEdge = new graphql_1.GraphQLObjectType({
    name: 'GalleryImageEdge',
    fields: {
        caption: { type: graphql_1.GraphQLString },
        image: {
            type: image_1.GraphQLImage,
            resolve: (0, utility_1.createProxyingResolver)(({ imageID }, args, { loaders }) => {
                return imageID ? loaders.images.load(imageID) : null;
            })
        }
    }
});
exports.GraphQLImageBlock = new graphql_1.GraphQLObjectType({
    name: 'ImageBlock',
    fields: {
        image: {
            type: image_1.GraphQLImage,
            resolve: (0, utility_1.createProxyingResolver)(({ imageID }, _args, { loaders }) => {
                return imageID ? loaders.images.load(imageID) : null;
            })
        },
        caption: { type: graphql_1.GraphQLString }
    },
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === block_1.BlockType.Image;
    })
});
exports.GraphQLImageGalleryBlock = new graphql_1.GraphQLObjectType({
    name: 'ImageGalleryBlock',
    fields: {
        images: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLGalleryImageEdge)))
        }
    },
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === block_1.BlockType.ImageGallery;
    })
});
exports.GraphQLFacebookPostBlock = new graphql_1.GraphQLObjectType({
    name: 'FacebookPostBlock',
    fields: {
        userID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        postID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    },
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === block_1.BlockType.FacebookPost;
    })
});
exports.GraphQLFacebookVideoBlock = new graphql_1.GraphQLObjectType({
    name: 'FacebookVideoBlock',
    fields: {
        userID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        videoID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    },
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === block_1.BlockType.FacebookVideo;
    })
});
exports.GraphQLInstagramPostBlock = new graphql_1.GraphQLObjectType({
    name: 'InstagramPostBlock',
    fields: {
        postID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    },
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === block_1.BlockType.InstagramPost;
    })
});
exports.GraphQLTwitterTweetBlock = new graphql_1.GraphQLObjectType({
    name: 'TwitterTweetBlock',
    fields: {
        userID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        tweetID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    },
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === block_1.BlockType.TwitterTweet;
    })
});
exports.GraphQLVimeoVideoBlock = new graphql_1.GraphQLObjectType({
    name: 'VimeoVideoBlock',
    fields: {
        videoID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    },
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === block_1.BlockType.VimeoVideo;
    })
});
exports.GraphQLYouTubeVideoBlock = new graphql_1.GraphQLObjectType({
    name: 'YouTubeVideoBlock',
    fields: {
        videoID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    },
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === block_1.BlockType.YouTubeVideo;
    })
});
exports.GraphQLSoundCloudTrackBlock = new graphql_1.GraphQLObjectType({
    name: 'SoundCloudTrackBlock',
    fields: {
        trackID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    },
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === block_1.BlockType.SoundCloudTrack;
    })
});
exports.GraphQLPolisConversationBlock = new graphql_1.GraphQLObjectType({
    name: 'PolisConversationBlock',
    fields: {
        conversationID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    },
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === block_1.BlockType.PolisConversation;
    })
});
exports.GraphQLTikTokVideoBlock = new graphql_1.GraphQLObjectType({
    name: 'TikTokVideoBlock',
    fields: {
        videoID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        userID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    },
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === block_1.BlockType.TikTokVideo;
    })
});
exports.GraphQLBildwurfAdBlock = new graphql_1.GraphQLObjectType({
    name: 'BildwurfAdBlock',
    fields: {
        zoneID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    },
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === block_1.BlockType.BildwurfAd;
    })
});
exports.GraphQLHTMLBlock = new graphql_1.GraphQLObjectType({
    name: 'HTMLBlock',
    fields: {
        html: { type: graphql_1.GraphQLString }
    },
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === block_1.BlockType.HTML;
    })
});
exports.GraphQLPollBlock = new graphql_1.GraphQLObjectType({
    name: 'PollBlock',
    fields: {
        poll: {
            type: poll_1.GraphQLFullPoll,
            resolve: ({ pollId }, _, { loaders: { pollById } }) => pollById.load(pollId)
        }
    },
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === block_1.BlockType.Poll;
    })
});
exports.GraphQLCommentBlockFilter = new graphql_1.GraphQLObjectType({
    name: 'CommentBlockFilter',
    fields: {
        item: { type: graphql_1.GraphQLID },
        tags: { type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID)) },
        comments: { type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID)) }
    }
});
exports.GraphQLCommentBlock = new graphql_1.GraphQLObjectType({
    name: 'CommentBlock',
    fields: {
        filter: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLCommentBlockFilter) },
        comments: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(comment_1.GraphQLComment))),
            resolve: async ({ filter }, _, { prisma }) => {
                var _a, _b;
                return prisma.comment.findMany({
                    where: {
                        itemID: filter.item,
                        OR: [
                            {
                                tags: {
                                    some: {
                                        tagId: {
                                            in: (_a = filter.tags) !== null && _a !== void 0 ? _a : []
                                        }
                                    }
                                }
                            },
                            {
                                id: {
                                    in: (_b = filter.comments) !== null && _b !== void 0 ? _b : []
                                }
                            }
                        ]
                    },
                    include: {
                        revisions: { orderBy: { createdAt: 'asc' } }
                    }
                });
            }
        }
    },
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === block_1.BlockType.Comment;
    })
});
exports.GraphQLPublicCommentBlock = new graphql_1.GraphQLObjectType({
    name: 'CommentBlock',
    fields: {
        comments: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(comment_1.GraphQLPublicComment))),
            resolve: async ({ filter }, _, { prisma }) => {
                var _a, _b, _c;
                const comments = await prisma.comment.findMany({
                    where: {
                        itemID: (_a = filter.item) !== null && _a !== void 0 ? _a : undefined,
                        OR: [
                            {
                                tags: {
                                    some: {
                                        tagId: {
                                            in: (_b = filter.tags) !== null && _b !== void 0 ? _b : []
                                        }
                                    }
                                }
                            },
                            {
                                id: {
                                    in: (_c = filter.comments) !== null && _c !== void 0 ? _c : []
                                }
                            }
                        ]
                    },
                    include: {
                        revisions: { orderBy: { createdAt: 'asc' } },
                        overriddenRatings: true
                    }
                });
                return comments.map((_a) => {
                    var { revisions } = _a, comment = __rest(_a, ["revisions"]);
                    return (Object.assign({ text: revisions[revisions.length - 1].text }, comment));
                });
            }
        }
    },
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === block_1.BlockType.Comment;
    })
});
exports.GraphQLEmbedBlock = new graphql_1.GraphQLObjectType({
    name: 'EmbedBlock',
    fields: {
        url: { type: graphql_1.GraphQLString },
        title: { type: graphql_1.GraphQLString },
        width: { type: graphql_1.GraphQLInt },
        height: { type: graphql_1.GraphQLInt },
        styleCustom: { type: graphql_1.GraphQLString },
        sandbox: { type: graphql_1.GraphQLString }
    },
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === block_1.BlockType.Embed;
    })
});
exports.GraphQLListicleItem = new graphql_1.GraphQLObjectType({
    name: 'ListicleItem',
    fields: {
        title: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        image: {
            type: image_1.GraphQLImage,
            resolve: (0, utility_1.createProxyingResolver)(({ imageID }, _args, { loaders }) => {
                return imageID ? loaders.images.load(imageID) : null;
            })
        },
        richText: { type: (0, graphql_1.GraphQLNonNull)(richText_1.GraphQLRichText) }
    }
});
exports.GraphQLListicleBlock = new graphql_1.GraphQLObjectType({
    name: 'ListicleBlock',
    fields: {
        items: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLListicleItem))) }
    },
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === block_1.BlockType.Listicle;
    })
});
exports.GraphQLLinkPageBreakBlock = new graphql_1.GraphQLObjectType({
    name: 'LinkPageBreakBlock',
    fields: {
        text: { type: graphql_1.GraphQLString },
        richText: { type: (0, graphql_1.GraphQLNonNull)(richText_1.GraphQLRichText) },
        linkURL: { type: graphql_1.GraphQLString },
        linkText: { type: graphql_1.GraphQLString },
        linkTarget: { type: graphql_1.GraphQLString },
        hideButton: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) },
        styleOption: { type: graphql_1.GraphQLString },
        layoutOption: { type: graphql_1.GraphQLString },
        templateOption: { type: graphql_1.GraphQLString },
        image: {
            type: image_1.GraphQLImage,
            resolve: (0, utility_1.createProxyingResolver)(({ imageID }, _args, { loaders }) => {
                return imageID ? loaders.images.load(imageID) : null;
            })
        }
    },
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === block_1.BlockType.LinkPageBreak;
    })
});
exports.GraphQLTitleBlock = new graphql_1.GraphQLObjectType({
    name: 'TitleBlock',
    fields: {
        title: { type: graphql_1.GraphQLString },
        lead: { type: graphql_1.GraphQLString }
    },
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === block_1.BlockType.Title;
    })
});
exports.GraphQLQuoteBlock = new graphql_1.GraphQLObjectType({
    name: 'QuoteBlock',
    fields: {
        quote: { type: graphql_1.GraphQLString },
        author: { type: graphql_1.GraphQLString }
    },
    isTypeOf: (0, utility_1.createProxyingIsTypeOf)(value => {
        return value.type === block_1.BlockType.Quote;
    })
});
exports.GraphQLRichTextBlockInput = new graphql_1.GraphQLInputObjectType({
    name: 'RichTextBlockInput',
    fields: {
        richText: {
            type: (0, graphql_1.GraphQLNonNull)(richText_1.GraphQLRichText)
        }
    }
});
exports.GraphQLTitleBlockInput = new graphql_1.GraphQLInputObjectType({
    name: 'TitleBlockInput',
    fields: {
        title: { type: graphql_1.GraphQLString },
        lead: { type: graphql_1.GraphQLString }
    }
});
exports.GraphQLImageBlockInput = new graphql_1.GraphQLInputObjectType({
    name: 'ImageBlockInput',
    fields: {
        caption: { type: graphql_1.GraphQLString },
        imageID: { type: graphql_1.GraphQLID }
    }
});
exports.GraphQLGalleryImageEdgeInput = new graphql_1.GraphQLInputObjectType({
    name: 'GalleryImageEdgeInput',
    fields: {
        caption: { type: graphql_1.GraphQLString },
        imageID: { type: graphql_1.GraphQLID }
    }
});
exports.GraphQLImageGalleryBlockInput = new graphql_1.GraphQLInputObjectType({
    name: 'ImageGalleryBlockInput',
    fields: {
        images: { type: (0, graphql_1.GraphQLList)(exports.GraphQLGalleryImageEdgeInput) }
    }
});
exports.GraphQLListicleItemInput = new graphql_1.GraphQLInputObjectType({
    name: 'ListicleItemInput',
    fields: {
        title: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        imageID: { type: graphql_1.GraphQLID },
        richText: { type: (0, graphql_1.GraphQLNonNull)(richText_1.GraphQLRichText) }
    }
});
exports.GraphQLListicleBlockInput = new graphql_1.GraphQLInputObjectType({
    name: 'ListicleBlockInput',
    fields: {
        items: { type: (0, graphql_1.GraphQLList)(exports.GraphQLListicleItemInput) }
    }
});
exports.GraphQLQuoteBlockInput = new graphql_1.GraphQLInputObjectType({
    name: 'QuoteBlockInput',
    fields: {
        quote: { type: graphql_1.GraphQLString },
        author: { type: graphql_1.GraphQLString }
    }
});
exports.GraphQLLinkPageBreakBlockInput = new graphql_1.GraphQLInputObjectType({
    name: 'LinkPageBreakBlockInput',
    fields: {
        text: { type: graphql_1.GraphQLString },
        richText: { type: (0, graphql_1.GraphQLNonNull)(richText_1.GraphQLRichText) },
        linkURL: { type: graphql_1.GraphQLString },
        linkText: { type: graphql_1.GraphQLString },
        linkTarget: { type: graphql_1.GraphQLString },
        hideButton: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) },
        styleOption: { type: graphql_1.GraphQLString },
        templateOption: { type: graphql_1.GraphQLString },
        layoutOption: { type: graphql_1.GraphQLString },
        imageID: { type: graphql_1.GraphQLID }
    }
});
exports.GraphQLFacebookPostBlockInput = new graphql_1.GraphQLInputObjectType({
    name: 'FacebookPostBlockInput',
    fields: {
        userID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        postID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    }
});
exports.GraphQLFacebookVideoBlockInput = new graphql_1.GraphQLInputObjectType({
    name: 'FacebookVideoBlockInput',
    fields: {
        userID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        videoID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    }
});
exports.GraphQLInstagramPostBlockInput = new graphql_1.GraphQLInputObjectType({
    name: 'InstagramPostBlockInput',
    fields: {
        postID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    }
});
exports.GraphQLTwitterTweetBlockInput = new graphql_1.GraphQLInputObjectType({
    name: 'TwitterTweetBlockInput',
    fields: {
        userID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        tweetID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    }
});
exports.GraphQLVimeoVideoBlockInput = new graphql_1.GraphQLInputObjectType({
    name: 'VimeoVideoBlockInput',
    fields: {
        videoID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    }
});
exports.GraphQLYouTubeVideoBlockInput = new graphql_1.GraphQLInputObjectType({
    name: 'YouTubeVideoBlockInput',
    fields: {
        videoID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    }
});
exports.GraphQLSoundCloudTrackBlockInput = new graphql_1.GraphQLInputObjectType({
    name: 'SoundCloudTrackBlockInput',
    fields: {
        trackID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    }
});
exports.GraphQLPolisConversationBlockInput = new graphql_1.GraphQLInputObjectType({
    name: 'PolisConversationBlockInput',
    fields: {
        conversationID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    }
});
exports.GraphQLTikTokVideoBlockInput = new graphql_1.GraphQLInputObjectType({
    name: 'TikTokVideoBlockInput',
    fields: {
        videoID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        userID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    }
});
exports.GraphQLBildwurfAdBlockInput = new graphql_1.GraphQLInputObjectType({
    name: 'BildwurfAdBlockInput',
    fields: {
        zoneID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    }
});
exports.GraphQLEmbedBlockInput = new graphql_1.GraphQLInputObjectType({
    name: 'EmbedBlockInput',
    fields: {
        url: { type: graphql_1.GraphQLString },
        title: { type: graphql_1.GraphQLString },
        width: { type: graphql_1.GraphQLInt },
        height: { type: graphql_1.GraphQLInt },
        styleCustom: { type: graphql_1.GraphQLString },
        sandbox: { type: graphql_1.GraphQLString }
    }
});
exports.GraphQLHTMLBlockInput = new graphql_1.GraphQLInputObjectType({
    name: 'HTMLBlockInput',
    fields: {
        html: { type: graphql_1.GraphQLString }
    }
});
exports.GraphQLPollBlockInput = new graphql_1.GraphQLInputObjectType({
    name: 'PollBlockInput',
    fields: {
        pollId: { type: graphql_1.GraphQLID }
    }
});
exports.GraphQLCommentBlockInputFilter = new graphql_1.GraphQLInputObjectType({
    name: 'CommentBlockInputFilter',
    fields: {
        item: { type: graphql_1.GraphQLID },
        tags: { type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID)) },
        comments: { type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID)) }
    }
});
exports.GraphQLCommentBlockInput = new graphql_1.GraphQLInputObjectType({
    name: 'CommentBlockInput',
    fields: {
        filter: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLCommentBlockInputFilter) }
    }
});
exports.GraphQLArticleTeaserInput = new graphql_1.GraphQLInputObjectType({
    name: 'ArticleTeaserInput',
    fields: {
        style: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLTeaserStyle) },
        imageID: { type: graphql_1.GraphQLID },
        preTitle: { type: graphql_1.GraphQLString },
        title: { type: graphql_1.GraphQLString },
        lead: { type: graphql_1.GraphQLString },
        articleID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
    }
});
exports.GraphQLPeerArticleTeaserInput = new graphql_1.GraphQLInputObjectType({
    name: 'PeerArticleTeaserInput',
    fields: {
        style: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLTeaserStyle) },
        imageID: { type: graphql_1.GraphQLID },
        preTitle: { type: graphql_1.GraphQLString },
        title: { type: graphql_1.GraphQLString },
        lead: { type: graphql_1.GraphQLString },
        peerID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        articleID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
    }
});
exports.GraphQLPageTeaserInput = new graphql_1.GraphQLInputObjectType({
    name: 'PageTeaserInput',
    fields: {
        style: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLTeaserStyle) },
        imageID: { type: graphql_1.GraphQLID },
        preTitle: { type: graphql_1.GraphQLString },
        title: { type: graphql_1.GraphQLString },
        lead: { type: graphql_1.GraphQLString },
        pageID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
    }
});
exports.GraphQLCustomTeaserInput = new graphql_1.GraphQLInputObjectType({
    name: 'CustomTeaserInput',
    fields: {
        style: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLTeaserStyle) },
        imageID: { type: graphql_1.GraphQLID },
        preTitle: { type: graphql_1.GraphQLString },
        title: { type: graphql_1.GraphQLString },
        lead: { type: graphql_1.GraphQLString },
        contentUrl: { type: graphql_1.GraphQLString },
        properties: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(common_1.GraphQLMetadataPropertyInput))) }
    }
});
exports.GraphQLTeaserInput = new graphql_1.GraphQLInputObjectType({
    name: 'TeaserInput',
    fields: () => ({
        [block_1.TeaserType.Article]: { type: exports.GraphQLArticleTeaserInput },
        [block_1.TeaserType.PeerArticle]: { type: exports.GraphQLPeerArticleTeaserInput },
        [block_1.TeaserType.Page]: { type: exports.GraphQLPageTeaserInput },
        [block_1.TeaserType.Custom]: { type: exports.GraphQLCustomTeaserInput }
    })
});
exports.GraphQLTeaserGridBlockInput = new graphql_1.GraphQLInputObjectType({
    name: 'TeaserGridBlockInput',
    fields: {
        teasers: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)(exports.GraphQLTeaserInput)) },
        numColumns: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) }
    }
});
exports.GraphQLFlexTeaserInput = new graphql_1.GraphQLInputObjectType({
    name: 'FlexTeaserInput',
    fields: {
        teaser: { type: exports.GraphQLTeaserInput },
        alignment: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLFlexGridAlignmentInput) }
    }
});
exports.GraphQLTeaserGridFlexBlockInput = new graphql_1.GraphQLInputObjectType({
    name: 'TeaserGridFlexBlockInput',
    fields: {
        flexTeasers: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLFlexTeaserInput))) }
    }
});
exports.GraphQLBlockInput = new graphql_1.GraphQLInputObjectType({
    name: 'BlockInput',
    fields: () => ({
        [block_1.BlockType.RichText]: { type: exports.GraphQLRichTextBlockInput },
        [block_1.BlockType.Image]: { type: exports.GraphQLImageBlockInput },
        [block_1.BlockType.ImageGallery]: { type: exports.GraphQLImageGalleryBlockInput },
        [block_1.BlockType.Listicle]: { type: exports.GraphQLListicleBlockInput },
        [block_1.BlockType.Title]: { type: exports.GraphQLTitleBlockInput },
        [block_1.BlockType.Quote]: { type: exports.GraphQLQuoteBlockInput },
        [block_1.BlockType.FacebookPost]: { type: exports.GraphQLFacebookPostBlockInput },
        [block_1.BlockType.FacebookVideo]: { type: exports.GraphQLFacebookVideoBlockInput },
        [block_1.BlockType.InstagramPost]: { type: exports.GraphQLInstagramPostBlockInput },
        [block_1.BlockType.TwitterTweet]: { type: exports.GraphQLTwitterTweetBlockInput },
        [block_1.BlockType.VimeoVideo]: { type: exports.GraphQLVimeoVideoBlockInput },
        [block_1.BlockType.YouTubeVideo]: { type: exports.GraphQLYouTubeVideoBlockInput },
        [block_1.BlockType.SoundCloudTrack]: { type: exports.GraphQLSoundCloudTrackBlockInput },
        [block_1.BlockType.PolisConversation]: { type: exports.GraphQLPolisConversationBlockInput },
        [block_1.BlockType.TikTokVideo]: { type: exports.GraphQLTikTokVideoBlockInput },
        [block_1.BlockType.BildwurfAd]: { type: exports.GraphQLBildwurfAdBlockInput },
        [block_1.BlockType.Embed]: { type: exports.GraphQLEmbedBlockInput },
        [block_1.BlockType.HTML]: { type: exports.GraphQLHTMLBlockInput },
        [block_1.BlockType.Poll]: { type: exports.GraphQLPollBlockInput },
        [block_1.BlockType.Comment]: { type: exports.GraphQLCommentBlockInput },
        [block_1.BlockType.LinkPageBreak]: { type: exports.GraphQLLinkPageBreakBlockInput },
        [block_1.BlockType.TeaserGrid]: { type: exports.GraphQLTeaserGridBlockInput },
        [block_1.BlockType.TeaserGridFlex]: { type: exports.GraphQLTeaserGridFlexBlockInput }
    })
});
exports.GraphQLBlock = new graphql_1.GraphQLUnionType({
    name: 'Block',
    types: () => [
        exports.GraphQLRichTextBlock,
        exports.GraphQLImageBlock,
        exports.GraphQLImageGalleryBlock,
        exports.GraphQLListicleBlock,
        exports.GraphQLFacebookPostBlock,
        exports.GraphQLFacebookVideoBlock,
        exports.GraphQLInstagramPostBlock,
        exports.GraphQLTwitterTweetBlock,
        exports.GraphQLVimeoVideoBlock,
        exports.GraphQLYouTubeVideoBlock,
        exports.GraphQLSoundCloudTrackBlock,
        exports.GraphQLPolisConversationBlock,
        exports.GraphQLTikTokVideoBlock,
        exports.GraphQLBildwurfAdBlock,
        exports.GraphQLEmbedBlock,
        exports.GraphQLHTMLBlock,
        exports.GraphQLPollBlock,
        exports.GraphQLCommentBlock,
        exports.GraphQLLinkPageBreakBlock,
        exports.GraphQLTitleBlock,
        exports.GraphQLQuoteBlock,
        exports.GraphQLTeaserGridBlock,
        exports.GraphQLTeaserGridFlexBlock
    ]
});
exports.GraphQLPublicBlock = new graphql_1.GraphQLUnionType({
    name: 'Block',
    types: () => [
        exports.GraphQLRichTextBlock,
        exports.GraphQLImageBlock,
        exports.GraphQLImageGalleryBlock,
        exports.GraphQLListicleBlock,
        exports.GraphQLFacebookPostBlock,
        exports.GraphQLInstagramPostBlock,
        exports.GraphQLTwitterTweetBlock,
        exports.GraphQLVimeoVideoBlock,
        exports.GraphQLYouTubeVideoBlock,
        exports.GraphQLSoundCloudTrackBlock,
        exports.GraphQLPolisConversationBlock,
        exports.GraphQLTikTokVideoBlock,
        exports.GraphQLBildwurfAdBlock,
        exports.GraphQLEmbedBlock,
        exports.GraphQLHTMLBlock,
        exports.GraphQLPollBlock,
        exports.GraphQLPublicCommentBlock,
        exports.GraphQLLinkPageBreakBlock,
        exports.GraphQLTitleBlock,
        exports.GraphQLQuoteBlock,
        exports.GraphQLPublicTeaserGridBlock,
        exports.GraphQLPublicTeaserGridFlexBlock
    ]
});
//# sourceMappingURL=blocks.js.map