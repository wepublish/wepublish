import { GraphQLEnumType, GraphQLInputObjectType, GraphQLObjectType, GraphQLUnionType } from 'graphql';
import { Context } from '../context';
import { ArticleTeaser, BildwurfAdBlock, CommentBlock, CustomTeaser, EmbedBlock, FacebookPostBlock, FacebookVideoBlock, FlexAlignment, FlexTeaser, HTMLBlock, ImageBlock, ImageCaptionEdge, ImageGalleryBlock, InstagramPostBlock, LinkPageBreakBlock, ListicleBlock, ListicleItem, PageTeaser, PeerArticleTeaser, PolisConversationBlock, PollBlock, QuoteBlock, RichTextBlock, SoundCloudTrackBlock, TeaserGridBlock, TeaserGridFlexBlock, TikTokVideoBlock, TitleBlock, TwitterTweetBlock, VimeoVideoBlock, YouTubeVideoBlock } from '../db/block';
export declare const GraphQLTeaserStyle: GraphQLEnumType;
export declare const GraphQLRichTextBlock: GraphQLObjectType<RichTextBlock, any, {
    [key: string]: any;
}>;
export declare const GraphQLArticleTeaser: GraphQLObjectType<ArticleTeaser, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPeerArticleTeaser: GraphQLObjectType<PeerArticleTeaser, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPageTeaser: GraphQLObjectType<PageTeaser, Context, {
    [key: string]: any;
}>;
export declare const GraphQLCustomTeaser: GraphQLObjectType<CustomTeaser, Context, {
    [key: string]: any;
}>;
export declare const GraphQLTeaser: GraphQLUnionType;
export declare const GraphQLTeaserGridBlock: GraphQLObjectType<TeaserGridBlock, Context, {
    [key: string]: any;
}>;
export declare const GraphQLFlexGridAlignment: GraphQLObjectType<FlexAlignment, Context, {
    [key: string]: any;
}>;
export declare const GraphQLFlexGridAlignmentInput: GraphQLInputObjectType;
export declare const GraphQLFlexTeaser: GraphQLObjectType<FlexTeaser, Context, {
    [key: string]: any;
}>;
export declare const GraphQLTeaserGridFlexBlock: GraphQLObjectType<TeaserGridFlexBlock, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPublicArticleTeaser: GraphQLObjectType<ArticleTeaser, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPublicPeerArticleTeaser: GraphQLObjectType<PeerArticleTeaser, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPublicPageTeaser: GraphQLObjectType<PageTeaser, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPublicCustomTeaser: GraphQLObjectType<CustomTeaser, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPublicTeaser: GraphQLUnionType;
export declare const GraphQLPublicTeaserGridBlock: GraphQLObjectType<TeaserGridBlock, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPublicFlexAlignment: GraphQLObjectType<FlexAlignment, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPublicFlexTeaser: GraphQLObjectType<FlexTeaser, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPublicTeaserGridFlexBlock: GraphQLObjectType<TeaserGridFlexBlock, Context, {
    [key: string]: any;
}>;
export declare const GraphQLGalleryImageEdge: GraphQLObjectType<ImageCaptionEdge, Context, {
    [key: string]: any;
}>;
export declare const GraphQLImageBlock: GraphQLObjectType<ImageBlock, Context, {
    [key: string]: any;
}>;
export declare const GraphQLImageGalleryBlock: GraphQLObjectType<ImageGalleryBlock, Context, {
    [key: string]: any;
}>;
export declare const GraphQLFacebookPostBlock: GraphQLObjectType<FacebookPostBlock, Context, {
    [key: string]: any;
}>;
export declare const GraphQLFacebookVideoBlock: GraphQLObjectType<FacebookVideoBlock, Context, {
    [key: string]: any;
}>;
export declare const GraphQLInstagramPostBlock: GraphQLObjectType<InstagramPostBlock, Context, {
    [key: string]: any;
}>;
export declare const GraphQLTwitterTweetBlock: GraphQLObjectType<TwitterTweetBlock, Context, {
    [key: string]: any;
}>;
export declare const GraphQLVimeoVideoBlock: GraphQLObjectType<VimeoVideoBlock, Context, {
    [key: string]: any;
}>;
export declare const GraphQLYouTubeVideoBlock: GraphQLObjectType<YouTubeVideoBlock, Context, {
    [key: string]: any;
}>;
export declare const GraphQLSoundCloudTrackBlock: GraphQLObjectType<SoundCloudTrackBlock, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPolisConversationBlock: GraphQLObjectType<PolisConversationBlock, Context, {
    [key: string]: any;
}>;
export declare const GraphQLTikTokVideoBlock: GraphQLObjectType<TikTokVideoBlock, Context, {
    [key: string]: any;
}>;
export declare const GraphQLBildwurfAdBlock: GraphQLObjectType<BildwurfAdBlock, Context, {
    [key: string]: any;
}>;
export declare const GraphQLHTMLBlock: GraphQLObjectType<HTMLBlock, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPollBlock: GraphQLObjectType<PollBlock, Context, {
    [key: string]: any;
}>;
export declare const GraphQLCommentBlockFilter: GraphQLObjectType<any, any, {
    [key: string]: any;
}>;
export declare const GraphQLCommentBlock: GraphQLObjectType<CommentBlock, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPublicCommentBlock: GraphQLObjectType<CommentBlock, Context, {
    [key: string]: any;
}>;
export declare const GraphQLEmbedBlock: GraphQLObjectType<EmbedBlock, Context, {
    [key: string]: any;
}>;
export declare const GraphQLListicleItem: GraphQLObjectType<ListicleItem, Context, {
    [key: string]: any;
}>;
export declare const GraphQLListicleBlock: GraphQLObjectType<ListicleBlock, Context, {
    [key: string]: any;
}>;
export declare const GraphQLLinkPageBreakBlock: GraphQLObjectType<LinkPageBreakBlock, Context, {
    [key: string]: any;
}>;
export declare const GraphQLTitleBlock: GraphQLObjectType<TitleBlock, Context, {
    [key: string]: any;
}>;
export declare const GraphQLQuoteBlock: GraphQLObjectType<QuoteBlock, Context, {
    [key: string]: any;
}>;
export declare const GraphQLRichTextBlockInput: GraphQLInputObjectType;
export declare const GraphQLTitleBlockInput: GraphQLInputObjectType;
export declare const GraphQLImageBlockInput: GraphQLInputObjectType;
export declare const GraphQLGalleryImageEdgeInput: GraphQLInputObjectType;
export declare const GraphQLImageGalleryBlockInput: GraphQLInputObjectType;
export declare const GraphQLListicleItemInput: GraphQLInputObjectType;
export declare const GraphQLListicleBlockInput: GraphQLInputObjectType;
export declare const GraphQLQuoteBlockInput: GraphQLInputObjectType;
export declare const GraphQLLinkPageBreakBlockInput: GraphQLInputObjectType;
export declare const GraphQLFacebookPostBlockInput: GraphQLInputObjectType;
export declare const GraphQLFacebookVideoBlockInput: GraphQLInputObjectType;
export declare const GraphQLInstagramPostBlockInput: GraphQLInputObjectType;
export declare const GraphQLTwitterTweetBlockInput: GraphQLInputObjectType;
export declare const GraphQLVimeoVideoBlockInput: GraphQLInputObjectType;
export declare const GraphQLYouTubeVideoBlockInput: GraphQLInputObjectType;
export declare const GraphQLSoundCloudTrackBlockInput: GraphQLInputObjectType;
export declare const GraphQLPolisConversationBlockInput: GraphQLInputObjectType;
export declare const GraphQLTikTokVideoBlockInput: GraphQLInputObjectType;
export declare const GraphQLBildwurfAdBlockInput: GraphQLInputObjectType;
export declare const GraphQLEmbedBlockInput: GraphQLInputObjectType;
export declare const GraphQLHTMLBlockInput: GraphQLInputObjectType;
export declare const GraphQLPollBlockInput: GraphQLInputObjectType;
export declare const GraphQLCommentBlockInputFilter: GraphQLInputObjectType;
export declare const GraphQLCommentBlockInput: GraphQLInputObjectType;
export declare const GraphQLArticleTeaserInput: GraphQLInputObjectType;
export declare const GraphQLPeerArticleTeaserInput: GraphQLInputObjectType;
export declare const GraphQLPageTeaserInput: GraphQLInputObjectType;
export declare const GraphQLCustomTeaserInput: GraphQLInputObjectType;
export declare const GraphQLTeaserInput: GraphQLInputObjectType;
export declare const GraphQLTeaserGridBlockInput: GraphQLInputObjectType;
export declare const GraphQLFlexTeaserInput: GraphQLInputObjectType;
export declare const GraphQLTeaserGridFlexBlockInput: GraphQLInputObjectType;
export declare const GraphQLBlockInput: GraphQLInputObjectType;
export declare const GraphQLBlock: GraphQLUnionType;
export declare const GraphQLPublicBlock: GraphQLUnionType;
//# sourceMappingURL=blocks.d.ts.map