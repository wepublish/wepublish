import {
  struct,
  string,
  dateTime,
  int32,
  unique,
  list,
  optional,
  float,
  union,
  dynamicRef,
  enum_,
  bool,
  recursion
} from '@karma.run/sdk/model'
import {VersionState, BlockType} from '@wepublish/api'

export enum ModelTag {
  Meta = 'meta',
  User = 'user',
  Author = 'author',
  Navigation = 'navigation',
  Session = 'session',
  Image = 'image',
  Article = 'article',
  ArticleVersion = 'articleVersion',
  Page = 'page',
  PageVersion = 'pageVersion'
}

export const MetaModel = struct({version: int32})

export const ImageModel = struct({
  id: unique(string),
  createdAt: dateTime,
  updatedAt: dateTime,

  filename: optional(string),
  title: optional(string),
  description: optional(string),
  tags: list(string),

  author: optional(string),
  source: optional(string),
  license: optional(string),

  fileSize: int32,
  extension: string,
  mimeType: string,
  format: string,
  width: int32,
  height: int32,
  focalPoint: optional(
    struct({
      x: float,
      y: float
    })
  )
})

export const UserModel = struct({
  id: unique(string),
  email: unique(string),
  password: string
})

export const AuthorModel = struct({
  id: unique(string),
  name: string,
  imageID: optional(string)
})

export const NavigationModel = struct({
  key: unique(string),
  name: string,
  links: list(
    union({
      page: struct({
        label: string,
        pageID: string
      }),
      article: struct({
        label: string,
        articleID: string
      }),
      external: struct({
        label: string,
        url: string
      })
    })
  )
})

export const SessionModel = struct({
  userID: string,
  token: string,
  expiryDate: dateTime
})

export const RichTextModel = recursion('node', recursion =>
  list(
    struct({
      type: optional(string),
      url: optional(string),
      title: optional(string),
      bold: optional(bool),
      italic: optional(bool),
      underline: optional(bool),
      strikethrough: optional(bool),
      text: optional(string),
      children: optional(recursion)
    })
  )
)

export const TitleBlockModel = struct({
  title: optional(string),
  lead: optional(string)
})

export const RichTextBlockModel = struct({
  richText: RichTextModel
})

export const ImageBlockModel = struct({
  caption: optional(string),
  imageID: optional(string)
})

export const ImageGalleryBlockModel = struct({
  images: list(
    struct({
      caption: optional(string),
      imageID: optional(string)
    })
  )
})

export const FacebookPostBlockModel = struct({
  userID: string,
  postID: string
})

export const InstagramPostBlockModel = struct({
  postID: string
})

export const TwitterTweetBlockModel = struct({
  userID: string,
  tweetID: string
})

export const VimeoVideoBlockModel = struct({
  videoID: string
})

export const YouTubeVideoBlockModel = struct({
  videoID: string
})

export const SoundCloudTrackBlockModel = struct({
  trackID: string
})

export const EmbedBlockModel = struct({
  url: optional(string),
  title: optional(string),
  width: optional(int32),
  height: optional(int32)
})

export const ListicleBlockModel = struct({
  listicle: list(
    struct({
      title: string,
      imageID: optional(string),
      richText: RichTextModel
    })
  )
})

export const LinkPageBreakBlockModel = struct({
  text: string,
  linkURL: string,
  linkText: string
})

export const QuoteBlockModel = struct({
  quote: optional(string),
  author: optional(string)
})

export const ArticleTeaserGridBlockModel = struct({
  teasers: list(
    optional(
      struct({
        type: optional(string),
        articleID: string,
        overrides: optional(
          struct({
            preTitle: optional(string),
            title: optional(string),
            lead: optional(string),
            imageID: optional(string)
          })
        )
      })
    )
  ),
  numColumns: int32
})

export const ArticleBlocksModel = list(
  union({
    [BlockType.Title]: TitleBlockModel,
    [BlockType.RichText]: RichTextBlockModel,
    [BlockType.Image]: ImageBlockModel,
    [BlockType.ImageGallery]: ImageGalleryBlockModel,
    [BlockType.FacebookPost]: FacebookPostBlockModel,
    [BlockType.InstagramPost]: InstagramPostBlockModel,
    [BlockType.TwitterTweet]: TwitterTweetBlockModel,
    [BlockType.VimeoVideo]: VimeoVideoBlockModel,
    [BlockType.YouTubeVideo]: YouTubeVideoBlockModel,
    [BlockType.SoundCloudTrack]: SoundCloudTrackBlockModel,
    [BlockType.Embed]: EmbedBlockModel,
    [BlockType.Listicle]: ListicleBlockModel,
    [BlockType.LinkPageBreak]: LinkPageBreakBlockModel,
    [BlockType.Quote]: QuoteBlockModel
  })
)

export const ArticleModel = struct({
  id: unique(string),

  createdAt: dateTime,
  updatedAt: dateTime,
  publishedAt: optional(dateTime),

  latestVersion: int32,
  publishedVersion: optional(int32),

  versions: list(dynamicRef(ModelTag.ArticleVersion))
})

export const ArticleVersionModel = struct({
  state: enum_([VersionState.Draft, VersionState.Published]),

  createdAt: dateTime,
  updatedAt: dateTime,

  preTitle: optional(string),
  title: string,
  lead: string,
  slug: string,
  tags: list(string),

  imageID: optional(string),
  authorIDs: list(string),

  shared: bool,
  breaking: bool,

  blocks: ArticleBlocksModel
})

export const PageBlocksModel = list(
  union({
    [BlockType.Title]: TitleBlockModel,
    [BlockType.Image]: ImageBlockModel,
    [BlockType.RichText]: RichTextBlockModel,
    [BlockType.LinkPageBreak]: LinkPageBreakBlockModel,
    [BlockType.ArticleTeaserGrid]: ArticleTeaserGridBlockModel
  })
)

export const PageModel = struct({
  id: unique(string),

  createdAt: dateTime,
  updatedAt: dateTime,
  publishedAt: optional(dateTime),
  publishedSlug: optional(string),

  latestVersion: int32,
  publishedVersion: optional(int32),

  versions: list(dynamicRef(ModelTag.PageVersion))
})

export const PageVersionModel = struct({
  state: enum_([VersionState.Draft, VersionState.Published]),

  createdAt: dateTime,
  updatedAt: dateTime,

  slug: string,
  title: string,
  description: string,
  tags: list(string),

  imageID: optional(string),
  blocks: PageBlocksModel
})

export const ModelTagMap = {
  [ModelTag.Meta]: MetaModel,
  [ModelTag.User]: UserModel,
  [ModelTag.Author]: AuthorModel,
  [ModelTag.Navigation]: NavigationModel,
  [ModelTag.Session]: SessionModel,
  [ModelTag.Image]: ImageModel,
  [ModelTag.Article]: ArticleModel,
  [ModelTag.ArticleVersion]: ArticleVersionModel,
  [ModelTag.Page]: PageModel,
  [ModelTag.PageVersion]: PageVersionModel
}
