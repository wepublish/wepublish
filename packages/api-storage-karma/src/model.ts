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
  bool
} from '@karma.run/sdk/model'
import {VersionState, BlockType} from '@wepublish/api'

export enum ModelTag {
  Migration = 'migration',
  User = 'user',
  Author = 'author',
  Navigation = 'navigation',
  Session = 'session',
  Image = 'image',
  Article = 'article',
  ArticleVersion = 'articleVersion'
}

export const MigrationModel = int32

export const ImageModel = struct({
  id: unique(string),
  createdAt: dateTime,
  updatedAt: dateTime,
  filename: string,
  fileSize: int32,
  extension: string,
  mimeType: string,
  title: string,
  description: string,
  tags: list(string),
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
  links: optional(
    list(
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
  )
})

export const SessionModel = struct({
  userID: string,
  token: string,
  expiryDate: dateTime
})

export const TitleBlockModel = struct({
  key: string,
  title: optional(string),
  lead: optional(string)
})

export const ImageBlockModel = struct({
  key: string,
  caption: optional(string),
  imageID: optional(string)
})

export const ArticleVersionBlocksModel = list(
  union({
    [BlockType.Title]: TitleBlockModel,
    [BlockType.Image]: ImageBlockModel
  })
)

export const ArticleModel = struct({
  id: unique(string),

  createdAt: dateTime,
  updatedAt: dateTime,
  publishedAt: optional(dateTime),

  latestVersion: int32,
  publishedVersion: optional(int32),
  draftVersion: optional(int32),

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

  blocks: ArticleVersionBlocksModel
})

export const ModelTagMap = {
  [ModelTag.Migration]: MigrationModel,
  [ModelTag.User]: UserModel,
  [ModelTag.Author]: AuthorModel,
  [ModelTag.Navigation]: NavigationModel,
  [ModelTag.Session]: SessionModel,
  [ModelTag.Image]: ImageModel,
  [ModelTag.Article]: ArticleModel,
  [ModelTag.ArticleVersion]: ArticleVersionModel
}
