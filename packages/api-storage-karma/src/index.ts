import {
  StorageAdapter,
  User,
  Session,
  Image,
  PageInfo,
  Pagination,
  ImageUpdate,
  Author,
  Navigation,
  NavigationLinkType,
  ArticleInput,
  Article,
  VersionState,
  ArticleBlock,
  PageBlock,
  ArticleVersion,
  ArticlesArguments,
  PageInput,
  Page,
  PageVersion
} from '@wepublish/api'

import {Remote} from '@karma.run/sdk'
import {createModelsAndTags, BuiltInTag} from '@karma.run/sdk/utility'

import {
  all,
  tag,
  create,
  data,
  string,
  delete_,
  update,
  refTo,
  define,
  scope,
  get,
  and,
  bool
} from '@karma.run/sdk/expression'

import bcrypt from 'bcrypt'

import {
  ImageModel,
  ModelTag,
  ModelTagMap,
  AuthorModel,
  NavigationModel,
  ArticleBlocksModel,
  PageBlocksModel
} from './model'

export interface KarmaStorageAdapterOptions {
  readonly url: string
  readonly user: string
  readonly password: string
  readonly hashCostFactor?: number
}

export class KarmaStorageAdapter implements StorageAdapter {
  private readonly user: string
  private readonly password: string
  private readonly hashCostFactor: number

  private readonly remote: Remote

  // TODO: Persistent / Refresh session
  // private session?: UserSession

  constructor({url, user, password, hashCostFactor = 10}: KarmaStorageAdapterOptions) {
    this.remote = new Remote(url)
    this.user = user
    this.password = password
    this.hashCostFactor = hashCostFactor
  }

  async initialize(): Promise<boolean> {
    let session = await this.getKarmaSession()

    // TEMP
    // session.resetDatabase()
    // session = await this.getKarmaSession()

    const tagStructs = await session.do(all(tag(BuiltInTag.Tag)))
    const tags: string[] = tagStructs.map(({tag}: any) => tag)

    if (tags.includes(ModelTag.Meta)) {
      return false
    } else {
      await session.do(createModelsAndTags(ModelTagMap))
      await session.do(create(tag(ModelTag.Meta), () => data(d => d.struct({version: d.int32(0)}))))

      return true
    }
  }

  async getKarmaSession() {
    // TODO: Persistent / Refresh session
    // if (this.session) return this.session

    // TEMP
    this.user
    return await this.remote.adminLogin(this.password)
    // return await this.remote.login(this.user, this.password)
  }

  async getArticle(id: string): Promise<Article | null> {
    const session = await this.getKarmaSession()

    try {
      return await session.do(
        all(tag(ModelTag.Article))
          .filterList((index, value) => value.field('id').equal(string(id)))
          .first()
      )
    } catch {
      return null
    }
  }

  async getArticleVersion(id: string, version: number): Promise<ArticleVersion | null> {
    const session = await this.getKarmaSession()

    try {
      const articleVersion = await session.do(
        all(tag(ModelTag.Article))
          .filterList((index, value) => value.field('id').equal(string(id)))
          .first()
          .field('versions')
          .slice(version, 1)
          .first()
          .get()
      )

      return {...articleVersion, id, version, blocks: articleVersion.blocks.map(unionToBlock)}
    } catch {
      return null
    }
  }

  async getArticleVersions(id: string): Promise<ArticleVersion[]> {
    const session = await this.getKarmaSession()

    try {
      const versions = await session.do(
        all(tag(ModelTag.Article))
          .filterList((index, value) => value.field('id').equal(string(id)))
          .first()
          .field('versions')
          .mapList((index, value) => value.get())
      )

      return versions.map((articleVersion: any, index: number) => ({
        ...articleVersion,
        id,
        index,
        blocks: articleVersion.blocks.map(unionToBlock)
      }))
    } catch {
      return []
    }
  }

  async getArticles(args: ArticlesArguments): Promise<Article[]> {
    const session = await this.getKarmaSession()

    // TODO: Filter and Pagination
    try {
      return await session.do(all(tag(ModelTag.Article)))
    } catch {
      return []
    }
  }

  async createArticle(id: string, input: ArticleInput): Promise<Article> {
    const session = await this.getKarmaSession()
    const date = new Date()

    const article = await session.do(
      get(
        create(tag(ModelTag.Article), () =>
          data(d =>
            d.struct({
              id: d.string(id),

              createdAt: d.dateTime(date),
              updatedAt: d.dateTime(date),
              publishedAt: input.state === VersionState.Published ? d.dateTime(date) : d.null(),

              latestVersion: d.int32(0),
              publishedVersion: input.state === VersionState.Published ? d.int32(0) : d.null(),

              versions: d.list([
                d.expr(
                  create(tag(ModelTag.ArticleVersion), () =>
                    data(d =>
                      d.struct({
                        state: d.symbol(input.state),

                        createdAt: d.dateTime(date),
                        updatedAt: d.dateTime(date),

                        preTitle: input.preTitle ? d.string(input.preTitle) : d.null(),
                        title: d.string(input.title),
                        lead: d.string(input.lead),
                        slug: d.string(input.slug),
                        tags: d.list(input.tags.map(tag => d.string(tag))),

                        imageID: input.imageID ? d.string(input.imageID) : d.null(),
                        authorIDs: d.list(input.authorIDs.map(authorID => d.string(authorID))),

                        shared: d.bool(input.shared),
                        breaking: d.bool(input.breaking),

                        blocks: ArticleBlocksModel.decode(
                          input.blocks.map(blockToUnion)
                        ).toDataConstructor()
                      })
                    )
                  )
                )
              ])
            })
          )
        )
      )
    )

    return {
      id: article.id,
      createdAt: date,
      updatedAt: date,
      publishedAt: input.state === VersionState.Published ? date : undefined,
      latestVersion: article.latestVersion,
      publishedVersion: article.publishedVersion
    }
  }

  async createArticleVersion(id: string, input: ArticleInput): Promise<Article | null> {
    const session = await this.getKarmaSession()
    const date = new Date()

    const article = await session.do(
      all(tag(ModelTag.Article))
        .filterList((index, value) => value.field('id').equal(string(id)))
        .first()
    )

    const newVersionIndex: number = article.latestVersion + 1
    const updatedArticle = await session.do(
      define('article', all(tag(ModelTag.Article))
        .filterList((index, value) => value.field('id').equal(string(id)))
        .first()),
      get(
        update(
          refTo(scope('article')),
          data(d =>
            d.struct({
              id: d.string(id),

              createdAt: d.dateTime(new Date(article.createdAt)),
              updatedAt: d.dateTime(date),

              publishedAt: article.publishedAt
                ? d.dateTime(new Date(article.publishedAt))
                : input.state === VersionState.Published
                ? d.dateTime(date)
                : d.null(),

              latestVersion: d.int32(newVersionIndex),

              publishedVersion: d.int32(
                input.state === VersionState.Published ? newVersionIndex : article.publishedVersion
              ),

              versions: d.list([
                ...article.versions.map((version: any) => d.ref(version)),
                d.expr(
                  create(tag(ModelTag.ArticleVersion), () =>
                    data(d =>
                      d.struct({
                        state: d.symbol(input.state),

                        createdAt: d.dateTime(date),
                        updatedAt: d.dateTime(date),

                        preTitle: input.preTitle ? d.string(input.preTitle) : d.null(),
                        title: d.string(input.title),
                        lead: d.string(input.lead),
                        slug: d.string(input.slug),
                        tags: d.list(input.tags.map(tag => d.string(tag))),

                        imageID: input.imageID ? d.string(input.imageID) : d.null(),
                        authorIDs: d.list(input.authorIDs.map(authorID => d.string(authorID))),

                        shared: d.bool(input.shared),
                        breaking: d.bool(input.breaking),

                        blocks: ArticleBlocksModel.decode(
                          input.blocks.map(blockToUnion)
                        ).toDataConstructor()
                      })
                    )
                  )
                )
              ])
            })
          )
        )
      )
    )

    return {
      id: updatedArticle.id,
      createdAt: updatedArticle.createdAt,
      updatedAt: updatedArticle.updatedAt,
      publishedAt: updatedArticle.publishedAt,
      latestVersion: updatedArticle.latestVersion,
      publishedVersion: updatedArticle.publishedVersion
    }
  }

  async updateArticleVersion(
    id: string,
    version: number,
    input: ArticleInput
  ): Promise<Article | null> {
    const session = await this.getKarmaSession()
    const updateDate = new Date()

    const article = await session.do(
      define('article', all(tag(ModelTag.Article))
        .filterList((index, value) => value.field('id').equal(string(id)))
        .first()),
      define('articleVersion', scope('article')
        .field('versions')
        .slice(version, 1)
        .first()
        .get()),
      update(
        refTo(scope('articleVersion')),
        data(d =>
          d.struct({
            state: d.symbol(input.state),

            createdAt: d.expr(scope('articleVersion').field('createdAt')),
            updatedAt: d.dateTime(updateDate),

            preTitle: input.preTitle ? d.string(input.preTitle) : d.null(),
            title: d.string(input.title),
            lead: d.string(input.lead),
            slug: d.string(input.slug),
            tags: d.list(input.tags.map(tag => d.string(tag))),

            imageID: input.imageID ? d.string(input.imageID) : d.null(),
            authorIDs: d.list(input.authorIDs.map(authorID => d.string(authorID))),

            shared: d.bool(input.shared),
            breaking: d.bool(input.breaking),

            blocks: ArticleBlocksModel.decode(input.blocks.map(blockToUnion)).toDataConstructor()
          })
        )
      ),
      get(
        update(
          refTo(scope('article')),
          scope('article')
            .setField(
              'updatedAt',
              data(d => d.dateTime(updateDate))
            )
            // TODO: Fix overriding original publishedAt date.
            .setField(
              'publishedAt',
              data(d =>
                input.state === VersionState.Published
                  ? d.dateTime(updateDate)
                  : d.expr(scope('article').field('publishedAt'))
              )
            )
            .setField(
              'publishedVersion',
              input.state === VersionState.Published
                ? scope('article').field('latestVersion')
                : scope('article').field('publishedVersion')
            )
        )
      )
    )

    return {
      id: article.id,
      createdAt: updateDate,
      updatedAt: updateDate,
      publishedAt: input.state === VersionState.Published ? updateDate : undefined,
      latestVersion: article.latestVersion,
      publishedVersion: article.publishedVersion
    }
  }

  async getPage(id: string | undefined, slug?: string): Promise<Page | null> {
    const session = await this.getKarmaSession()

    try {
      return await session.do(
        all(tag(ModelTag.Page))
          .filterList((index, value) =>
            and(
              id != undefined ? value.field('id').equal(string(id)) : bool(true),
              slug != undefined ? value.field('publishedSlug').equal(string(slug)) : bool(true)
            )
          )
          .first()
      )
    } catch {
      return null
    }
  }

  async getPageVersion(id: string, version: number): Promise<PageVersion | null> {
    const session = await this.getKarmaSession()

    try {
      const articleVersion = await session.do(
        all(tag(ModelTag.Page))
          .filterList((index, value) => value.field('id').equal(string(id)))
          .first()
          .field('versions')
          .slice(version, 1)
          .first()
          .get()
      )

      return {...articleVersion, id, version, blocks: articleVersion.blocks.map(unionToBlock)}
    } catch {
      return null
    }
  }

  async getPageVersions(id: string): Promise<PageVersion[]> {
    const session = await this.getKarmaSession()

    try {
      const versions = await session.do(
        all(tag(ModelTag.Page))
          .filterList((index, value) => value.field('id').equal(string(id)))
          .first()
          .field('versions')
          .mapList((index, value) => value.get())
      )

      return versions.map((articleVersion: any, index: number) => ({
        ...articleVersion,
        id,
        index,
        blocks: articleVersion.blocks.map(unionToBlock)
      }))
    } catch {
      return []
    }
  }

  async getPages(): Promise<Page[]> {
    const session = await this.getKarmaSession()

    // TODO: Filter and Pagination
    try {
      return await session.do(all(tag(ModelTag.Page)))
    } catch {
      return []
    }
  }

  async createPage(id: string, input: PageInput): Promise<Page> {
    const session = await this.getKarmaSession()
    const date = new Date()

    const article = await session.do(
      get(
        create(tag(ModelTag.Page), () =>
          data(d =>
            d.struct({
              id: d.string(id),

              createdAt: d.dateTime(date),
              updatedAt: d.dateTime(date),
              publishedAt: input.state === VersionState.Published ? d.dateTime(date) : d.null(),
              publishedSlug:
                input.state === VersionState.Published ? d.string(input.slug) : d.null(),

              latestVersion: d.int32(0),
              publishedVersion: input.state === VersionState.Published ? d.int32(0) : d.null(),

              versions: d.list([
                d.expr(
                  create(tag(ModelTag.PageVersion), () =>
                    data(d =>
                      d.struct({
                        state: d.symbol(input.state),

                        createdAt: d.dateTime(date),
                        updatedAt: d.dateTime(date),

                        title: d.string(input.title),
                        description: d.string(input.description),
                        slug: d.string(input.slug),
                        tags: d.list(input.tags.map(tag => d.string(tag))),

                        imageID: input.imageID ? d.string(input.imageID) : d.null(),

                        blocks: PageBlocksModel.decode(
                          input.blocks.map(blockToUnion)
                        ).toDataConstructor()
                      })
                    )
                  )
                )
              ])
            })
          )
        )
      )
    )

    return {
      id: article.id,
      createdAt: date,
      updatedAt: date,
      publishedAt: input.state === VersionState.Published ? date : undefined,
      latestVersion: article.latestVersion,
      publishedVersion: article.publishedVersion
    }
  }

  async createPageVersion(id: string, input: PageInput): Promise<Page | null> {
    const session = await this.getKarmaSession()
    const date = new Date()

    const page = await session.do(
      all(tag(ModelTag.Page))
        .filterList((index, value) => value.field('id').equal(string(id)))
        .first()
    )

    const newVersionIndex: number = page.latestVersion + 1
    const updatedArticle = await session.do(
      define('page', all(tag(ModelTag.Page))
        .filterList((index, value) => value.field('id').equal(string(id)))
        .first()),
      get(
        update(
          refTo(scope('page')),
          data(d =>
            d.struct({
              id: d.string(id),

              createdAt: d.dateTime(new Date(page.createdAt)),
              updatedAt: d.dateTime(date),

              publishedAt: page.publishedAt
                ? d.dateTime(new Date(page.publishedAt))
                : input.state === VersionState.Published
                ? d.dateTime(date)
                : d.null(),

              publishedSlug:
                input.state === VersionState.Published
                  ? d.string(input.slug)
                  : d.string(page.publishedSlug),

              latestVersion: d.int32(newVersionIndex),

              publishedVersion: d.int32(
                input.state === VersionState.Published ? newVersionIndex : page.publishedVersion
              ),

              versions: d.list([
                ...page.versions.map((version: any) => d.ref(version)),
                d.expr(
                  create(tag(ModelTag.PageVersion), () =>
                    data(d =>
                      d.struct({
                        state: d.symbol(input.state),

                        createdAt: d.dateTime(date),
                        updatedAt: d.dateTime(date),

                        title: d.string(input.title),
                        description: d.string(input.description),
                        slug: d.string(input.slug),
                        tags: d.list(input.tags.map(tag => d.string(tag))),

                        imageID: input.imageID ? d.string(input.imageID) : d.null(),

                        blocks: PageBlocksModel.decode(
                          input.blocks.map(blockToUnion)
                        ).toDataConstructor()
                      })
                    )
                  )
                )
              ])
            })
          )
        )
      )
    )

    return {
      id: updatedArticle.id,
      createdAt: updatedArticle.createdAt,
      updatedAt: updatedArticle.updatedAt,
      publishedAt: updatedArticle.publishedAt,
      latestVersion: updatedArticle.latestVersion,
      publishedVersion: updatedArticle.publishedVersion
    }
  }

  async updatePageVersion(id: string, version: number, input: PageInput): Promise<Page | null> {
    const session = await this.getKarmaSession()
    const updateDate = new Date()

    const article = await session.do(
      define('page', all(tag(ModelTag.Page))
        .filterList((index, value) => value.field('id').equal(string(id)))
        .first()),
      define('pageVersion', scope('page')
        .field('versions')
        .slice(version, 1)
        .first()
        .get()),
      update(
        refTo(scope('pageVersion')),
        data(d =>
          d.struct({
            state: d.symbol(input.state),

            createdAt: d.expr(scope('pageVersion').field('createdAt')),
            updatedAt: d.dateTime(updateDate),

            title: d.string(input.title),
            description: d.string(input.description),
            slug: d.string(input.slug),
            tags: d.list(input.tags.map(tag => d.string(tag))),

            imageID: input.imageID ? d.string(input.imageID) : d.null(),
            blocks: PageBlocksModel.decode(input.blocks.map(blockToUnion)).toDataConstructor()
          })
        )
      ),
      get(
        update(
          refTo(scope('page')),
          scope('page')
            .setField(
              'updatedAt',
              data(d => d.dateTime(updateDate))
            )
            // TODO: Fix overriding original publishedAt date.
            .setField(
              'publishedAt',
              data(d =>
                input.state === VersionState.Published
                  ? d.dateTime(updateDate)
                  : d.expr(scope('page').field('publishedAt'))
              )
            )
            .setField(
              'publishedVersion',
              input.state === VersionState.Published
                ? scope('page').field('latestVersion')
                : scope('page').field('publishedVersion')
            )
            .setField(
              'publishedSlug',
              input.state === VersionState.Published
                ? string(input.slug)
                : scope('page').field('publishedSlug')
            )
        )
      )
    )

    return {
      id: article.id,
      createdAt: updateDate,
      updatedAt: updateDate,
      publishedAt: input.state === VersionState.Published ? updateDate : undefined,
      latestVersion: article.latestVersion,
      publishedVersion: article.publishedVersion
    }
  }

  async createImage(image: Image): Promise<Image> {
    const session = await this.getKarmaSession()

    await session.do(
      create(tag(ModelTag.Image), () => data(ImageModel.decode(image).toDataConstructor()))
    )

    return image
  }

  async updateImage({
    id,
    updatedAt,
    filename,
    title,
    description,
    tags,
    author,
    source,
    license,
    focalPoint
  }: ImageUpdate): Promise<Image | null> {
    const session = await this.getKarmaSession()
    const image = await this.getImage(id)

    if (!image) return null

    try {
      const response = await session.do(
        define('image', all(tag(ModelTag.Image))
          .filterList((index, value) => value.field('id').equal(string(id)))
          .first()),
        get(
          update(
            refTo(scope('image')),
            data(
              ImageModel.decode({
                ...image,
                updatedAt,
                filename,
                title,
                description,
                tags,
                author,
                source,
                license,
                focalPoint
              }).toDataConstructor()
            )
          )
        )
      )

      return {...response, tags: response.tags ?? []}
    } catch {
      return null
    }
  }

  async getImage(id: string): Promise<Image | null> {
    const session = await this.getKarmaSession()

    try {
      return await session.do(
        all(tag(ModelTag.Image))
          .filterList((index, value) => value.field('id').equal(string(id)))
          .first()
      )
    } catch {
      return null
    }
  }

  async getImages(pagination: Pagination): Promise<[Image[], PageInfo, number]> {
    const session = await this.getKarmaSession()

    try {
      // TODO: Pagination
      const images = await session.do(all(tag(ModelTag.Image)))

      return [
        images,
        {startCursor: null, endCursor: null, hasNextPage: false, hasPreviousPage: false},
        images.length
      ]
    } catch {
      return [
        [],
        {startCursor: null, endCursor: null, hasNextPage: false, hasPreviousPage: false},
        0
      ]
    }
  }

  async createNavigation(navigation: Navigation): Promise<Navigation> {
    const session = await this.getKarmaSession()

    await session.do(
      create(tag(ModelTag.Navigation), () =>
        data(
          NavigationModel.decode({
            ...navigation,
            links: navigation.links.map(link => {
              switch (link.type) {
                case NavigationLinkType.Article:
                  return {article: {label: link.label, articleID: link.articleID}}

                case NavigationLinkType.Page:
                  return {page: {label: link.label, pageID: link.pageID}}

                case NavigationLinkType.External:
                  return {external: {label: link.label, url: link.url}}
              }
            })
          }).toDataConstructor()
        )
      )
    )

    return navigation
  }

  async getNavigation(key: string): Promise<Navigation | null> {
    const session = await this.getKarmaSession()

    try {
      const navigation = await session.do(
        all(tag(ModelTag.Navigation))
          .filterList((index, value) => value.field('key').equal(string(key)))
          .first()
      )

      return {
        ...navigation,
        links: navigation.links.map((link: any) => {
          const key = Object.keys(link)[0]
          const value = link[key]

          switch (key) {
            case 'article':
              return {type: NavigationLinkType.Article, ...value}

            case 'page':
              return {type: NavigationLinkType.Page, ...value}

            case 'external':
              return {type: NavigationLinkType.External, ...value}
          }
        })
      }
    } catch {
      return null
    }
  }

  async createAuthor(author: Author): Promise<Author> {
    const session = await this.getKarmaSession()

    await session.do(
      create(tag(ModelTag.Author), () => data(AuthorModel.decode(author).toDataConstructor()))
    )

    return author
  }

  async getAuthor(id: string): Promise<Author | null> {
    const session = await this.getKarmaSession()

    try {
      return await session.do(
        all(tag(ModelTag.Author))
          .filterList((index, value) => value.field('id').equal(string(id)))
          .first()
      )
    } catch {
      return null
    }
  }

  async createPeer() {
    return {} as any // TODO
  }

  async getPeer() {
    return {} as any // TODO
  }

  async getPeers() {
    return {} as any // TODO
  }

  async createUser(id: string, email: string, password: string): Promise<User> {
    const session = await this.getKarmaSession()
    const passwordHash = await bcrypt.hash(password, this.hashCostFactor)

    await session.do(
      create(tag(ModelTag.User), () =>
        data(d =>
          d.struct({
            id: d.string(id),
            email: d.string(email),
            password: d.string(passwordHash)
          })
        )
      )
    )

    return {id, email}
  }

  async getUserForCredentials(inputEmail: string, inputPassword: string): Promise<User | null> {
    const session = await this.getKarmaSession()

    try {
      const {id, email, password} = await session.do(
        all(tag(ModelTag.User))
          .filterList((index, value) => value.field('email').equal(string(inputEmail)))
          .first()
      )

      if (await bcrypt.compare(inputPassword, password)) {
        return {id, email}
      } else {
        return null
      }
    } catch {
      return null
    }
  }

  async createSession(user: User, token: string, expiryDate: Date): Promise<Session> {
    const session = await this.getKarmaSession()

    await session.do(
      create(tag(ModelTag.Session), () =>
        data(d =>
          d.struct({
            userID: d.string(user.id),
            token: d.string(token),
            expiryDate: d.dateTime(expiryDate)
          })
        )
      )
    )

    return {user, token, expiryDate}
  }

  async getSession(inputToken: string): Promise<Session | null> {
    const session = await this.getKarmaSession()

    try {
      const {userID, token, expiryDate} = await session.do(
        all(tag(ModelTag.Session))
          .filterList((index, value) => value.field('token').equal(string(inputToken)))
          .first()
      )

      const {id, email} = await session.do(
        all(tag(ModelTag.User))
          .filterList((index, value) => value.field('id').equal(string(userID)))
          .first()
      )

      return {user: {id, email}, token: token, expiryDate: new Date(expiryDate)}
    } catch {}

    return null
  }

  async deleteSession(inputToken: string): Promise<void> {
    const session = await this.getKarmaSession()

    try {
      await session.do(
        delete_(
          all(tag(ModelTag.Session))
            .filterList((index, value) => value.field('token').equal(string(inputToken)))
            .first()
            .metarialize()
            .field('id')
        )
      )
    } catch {}
  }
}

function blockToUnion(block: ArticleBlock | PageBlock) {
  switch (block.type) {
    default: {
      const {type, ...value} = block
      return {[type]: value}
    }
  }
}

function unionToBlock(union: any): ArticleBlock | PageBlock {
  const key = Object.keys(union)[0]
  const value = union[key]

  switch (key) {
    default:
      return {type: key, ...value}
  }
}
