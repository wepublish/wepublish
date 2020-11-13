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

import {Remote, UserSession} from '@karma.run/sdk'
import {createModelsAndTags, BuiltInTag} from '@karma.run/sdk/utility'

import {
  all,
  tag,
  create,
  data,
  string,
  int32,
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
  // PageBlocksModel
} from './model'

export interface KarmaStorageAdapterOptions {
  readonly url: string
  readonly user: string
  readonly password: string
  readonly hashCostFactor?: number
}

const SessionRefreshInterval = 1000 * 60 * 10 // 5m

export class KarmaStorageAdapter implements StorageAdapter {
  private readonly user: string
  private readonly password: string
  private readonly hashCostFactor: number

  private readonly remote: Remote

  private lastSessionRefresh?: Date
  private session?: UserSession

  constructor({url, user, password, hashCostFactor = 10}: KarmaStorageAdapterOptions) {
    this.remote = new Remote(url)
    this.user = user
    this.password = password
    this.hashCostFactor = hashCostFactor
  }

  async initialize(): Promise<boolean> {
    try {
      const session = await this.getKarmaSession()
      const tagStructs = await session.do(all(tag(BuiltInTag.Tag)))
      const tags: string[] = tagStructs.map(({tag}: any) => tag)

      if (tags.includes(ModelTag.Meta)) {
        return false
      } else {
        await session.do(createModelsAndTags(ModelTagMap))
        await session.do(
          create(tag(ModelTag.Meta), () => data(d => d.struct({version: d.int32(0)})))
        )

        return true
      }
    } catch (err) {
      console.error(err)
      return false
    }
  }

  async getKarmaSession() {
    if (this.session) {
      if (this.lastSessionRefresh) {
        const delta = new Date().getTime() - this.lastSessionRefresh.getTime()
        if (delta < SessionRefreshInterval) return this.session
      }
    }

    this.session = await this.remote.login(this.user, this.password)
    this.lastSessionRefresh = new Date()

    return this.session
  }

  async getArticle(id: string): Promise<Article | null> {
    const session = await this.getKarmaSession()

    try {
      const article = await session.do(
        all(tag(ModelTag.Article))
          .filterList((index, value) => value.field('id').equal(string(id)))
          .first()
      )

      return {
        id: article.id,
        createdAt: new Date(article.createdAt),
        updatedAt: new Date(article.updatedAt),
        publishedAt: article.publishedAt ? new Date(article.publishedAt) : undefined,
        latestVersion: article.latestVersion,
        publishedVersion: article.publishedVersion
      }
    } catch (err) {
      console.error(err)
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
    } catch (err) {
      console.error(err)
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
    } catch (err) {
      console.error(err)
      return []
    }
  }

  async getArticles(filter: string | undefined, args: ArticlesArguments): Promise<Article[]> {
    const session = await this.getKarmaSession()

    // TODO: Filter and Pagination
    try {
      const articles: Article[] = await session.do(all(tag(ModelTag.Article)))

      if (filter) {
        const tuples = await Promise.all(
          articles.map(
            async article =>
              [await this.getArticleVersion(article.id, article.latestVersion), article] as const
          )
        )

        return tuples
          .filter(
            ([version]) => version?.title?.toLowerCase().includes(filter.toLowerCase()) ?? false
          )
          .map(([_, article]) => ({
            id: article.id,
            createdAt: new Date(article.createdAt),
            updatedAt: new Date(article.updatedAt),
            publishedAt: article.publishedAt ? new Date(article.publishedAt) : undefined,
            latestVersion: article.latestVersion,
            publishedVersion: article.publishedVersion
          }))
      } else {
        return articles.map(article => ({
          id: article.id,
          createdAt: new Date(article.createdAt),
          updatedAt: new Date(article.updatedAt),
          publishedAt: article.publishedAt ? new Date(article.publishedAt) : undefined,
          latestVersion: article.latestVersion,
          publishedVersion: article.publishedVersion
        }))
      }
    } catch (err) {
      console.error(err)
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
              publishedAt: d.null(),

              latestVersion: d.int32(0),
              publishedVersion: d.null(),

              versions: d.list([
                d.expr(
                  create(tag(ModelTag.ArticleVersion), () =>
                    data(d =>
                      d.struct({
                        state: d.symbol(VersionState.Draft),

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
      createdAt: new Date(article.createdAt),
      updatedAt: new Date(article.updatedAt),
      latestVersion: article.latestVersion
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
      define('newVersions', data(d =>
        d.list([
          ...article.versions.map((version: any) => d.ref(version)),
          d.expr(
            create(tag(ModelTag.ArticleVersion), () =>
              data(d =>
                d.struct({
                  state: d.symbol(VersionState.Draft),

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
      )),
      get(
        update(
          refTo(scope('article')),
          scope('article')
            .setField(
              'latestVersion',
              data(d => d.int32(newVersionIndex))
            )
            .setField('versions', scope('newVersions'))
        )
      )
    )

    return {
      id: updatedArticle.id,
      createdAt: new Date(updatedArticle.createdAt),
      updatedAt: new Date(updatedArticle.updatedAt),
      publishedAt: updatedArticle.publishedAt ? new Date(updatedArticle.publishedAt) : undefined,
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
            state: d.symbol(VersionState.Draft),

            createdAt: d.expr(scope('articleVersion').field('createdAt')),
            updatedAt: d.dateTime(new Date()),

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
      get(refTo(scope('article')))
    )

    return {
      id: article.id,
      createdAt: new Date(article.createdAt),
      updatedAt: new Date(article.updatedAt),
      publishedAt: article.publishedAt ? new Date(article.publishedAt) : undefined,
      latestVersion: article.latestVersion,
      publishedVersion: article.publishedVersion
    }
  }

  async publishArticleVersion(
    id: string,
    version: number,
    publishedAt: Date,
    updatedAt: Date
  ): Promise<Article | null> {
    const session = await this.getKarmaSession()

    const articleVersion = await this.getArticleVersion(id, version)
    if (!articleVersion) return null

    const updatedArticle = await session.do(
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
        scope('articleVersion').setField(
          'state',
          data(d => d.symbol(VersionState.Published))
        )
      ),
      get(
        update(
          refTo(scope('article')),
          scope('article')
            .setField('publishedVersion', int32(articleVersion.version))
            .setField(
              'publishedAt',
              data(d => d.dateTime(publishedAt))
            )
            .setField(
              'updatedAt',
              data(d => d.dateTime(updatedAt))
            )
        )
      )
    )

    return {
      id: updatedArticle.id,
      createdAt: new Date(updatedArticle.createdAt),
      updatedAt: new Date(updatedArticle.updatedAt),
      publishedAt: updatedArticle.publishedAt ? new Date(updatedArticle.publishedAt) : undefined,
      latestVersion: updatedArticle.latestVersion,
      publishedVersion: updatedArticle.publishedVersion
    }
  }

  async unpublishArticle(id: string): Promise<Article | null> {
    const session = await this.getKarmaSession()
    const updatedArticle = await session.do(
      define('article', all(tag(ModelTag.Article))
        .filterList((index, value) => value.field('id').equal(string(id)))
        .first()),
      get(
        update(
          refTo(scope('article')),
          scope('article')
            .setField(
              'publishedVersion',
              data(d => d.null())
            )
            .setField(
              'publishedAt',
              data(d => d.null())
            )
        )
      )
    )

    return {
      id: updatedArticle.id,
      createdAt: new Date(updatedArticle.createdAt),
      updatedAt: new Date(updatedArticle.updatedAt),
      publishedAt: updatedArticle.publishedAt ? new Date(updatedArticle.publishedAt) : undefined,
      latestVersion: updatedArticle.latestVersion,
      publishedVersion: updatedArticle.publishedVersion
    }
  }

  async deleteArticle(deleteID: string): Promise<boolean | null> {
    const session = await this.getKarmaSession()

    await session.do(
      define('article', all(tag(ModelTag.Article))
        .filterList((index, value) => value.field('id').equal(string(deleteID)))
        .first()),
      delete_(refTo(scope('article'))),
      scope('article')
        .field('versions')
        .mapList((index, value) => delete_(value))
    )

    return true
  }

  async getPage(id: string | undefined, slug?: string): Promise<Page | null> {
    const session = await this.getKarmaSession()

    try {
      const page = await session.do(
        all(tag(ModelTag.Page))
          .filterList((index, value) =>
            and(
              id != undefined ? value.field('id').equal(string(id)) : bool(true),
              slug != undefined ? value.field('publishedSlug').equal(string(slug)) : bool(true)
            )
          )
          .first()
      )

      return {
        id: page.id,
        createdAt: new Date(page.createdAt),
        updatedAt: new Date(page.updatedAt),
        publishedAt: page.publishedAt ? new Date(page.publishedAt) : undefined,
        latestVersion: page.latestVersion,
        publishedVersion: page.publishedVersion
      }
    } catch (err) {
      console.error(err)
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
    } catch (err) {
      console.error(err)
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
    } catch (err) {
      console.error(err)
      return []
    }
  }

  async getPages(filter: string | undefined): Promise<Page[]> {
    const session = await this.getKarmaSession()

    // TODO: Filter and Pagination
    try {
      const pages: Page[] = await session.do(all(tag(ModelTag.Page)))

      if (filter) {
        const tuples = await Promise.all(
          pages.map(
            async page => [await this.getPageVersion(page.id, page.latestVersion), page] as const
          )
        )

        return tuples
          .filter(
            ([version]) => version?.title?.toLowerCase().includes(filter.toLowerCase()) ?? false
          )
          .map(([_, page]) => ({
            id: page.id,
            createdAt: new Date(page.createdAt),
            updatedAt: new Date(page.updatedAt),
            publishedAt: page.publishedAt ? new Date(page.publishedAt) : undefined,
            latestVersion: page.latestVersion,
            publishedVersion: page.publishedVersion
          }))
      } else {
        return pages.map(page => ({
          id: page.id,
          createdAt: new Date(page.createdAt),
          updatedAt: new Date(page.updatedAt),
          publishedAt: page.publishedAt ? new Date(page.publishedAt) : undefined,
          latestVersion: page.latestVersion,
          publishedVersion: page.publishedVersion
        }))
      }
    } catch (err) {
      console.error(err)
      return []
    }
  }

  async createPage(id: string, input: PageInput): Promise<Page> {
    const session = await this.getKarmaSession()
    const date = new Date()

    const page = await session.do(
      get(
        create(tag(ModelTag.Page), () =>
          data(d =>
            d.struct({
              id: d.string(id),

              createdAt: d.dateTime(date),
              updatedAt: d.dateTime(date),

              publishedAt: d.null(),
              publishedSlug: d.null(),

              latestVersion: d.int32(0),
              publishedVersion: d.null(),

              versions: d.list([
                d.expr(
                  create(tag(ModelTag.PageVersion), () =>
                    data(d =>
                      d.struct({
                        state: d.symbol(VersionState.Draft),

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
      id: page.id,
      createdAt: new Date(page.createdAt),
      updatedAt: new Date(page.updatedAt),
      latestVersion: page.latestVersion
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
    const updatedPage = await session.do(
      define('page', all(tag(ModelTag.Page))
        .filterList((index, value) => value.field('id').equal(string(id)))
        .first()),
      define('newVersion', data(d =>
        d.list([
          ...page.versions.map((version: any) => d.ref(version)),
          d.expr(
            create(tag(ModelTag.PageVersion), () =>
              data(d =>
                d.struct({
                  state: d.symbol(VersionState.Draft),

                  createdAt: d.dateTime(date),
                  updatedAt: d.dateTime(date),

                  title: d.string(input.title),
                  description: d.string(input.description),
                  slug: d.string(input.slug),
                  tags: d.list(input.tags.map(tag => d.string(tag))),

                  imageID: input.imageID ? d.string(input.imageID) : d.null(),

                  blocks: PageBlocksModel.decode(input.blocks.map(blockToUnion)).toDataConstructor()
                })
              )
            )
          )
        ])
      )),
      get(
        update(
          refTo(scope('page')),
          scope('page')
            .setField(
              'latestVersion',
              data(d => d.int32(newVersionIndex))
            )
            .setField('versions', scope('newVersion'))
        )
      )
    )

    return {
      id: updatedPage.id,
      createdAt: new Date(updatedPage.createdAt),
      updatedAt: new Date(updatedPage.updatedAt),
      publishedAt: updatedPage.publishedAt ? new Date(updatedPage.publishedAt) : undefined,
      latestVersion: updatedPage.latestVersion,
      publishedVersion: updatedPage.publishedVersion
    }
  }

  async updatePageVersion(id: string, version: number, input: PageInput): Promise<Page | null> {
    const session = await this.getKarmaSession()
    const updateDate = new Date()

    const page = await session.do(
      define('page', all(tag(ModelTag.Page))
        .filterList((index, value) => value.field('id').equal(string(id)))
        .first()),
      define('pageVersion', scope('page')
        .field('versions')
        .slice(version, 1)
        .first()
        .get()),
      get(
        update(
          refTo(scope('pageVersion')),
          data(d =>
            d.struct({
              state: d.symbol(VersionState.Draft),

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
        )
      ),
      get(refTo(scope('page')))
    )

    return {
      id: page.id,
      createdAt: new Date(page.createdAt),
      updatedAt: new Date(page.updatedAt),
      publishedAt: page.publishedAt ? new Date(page.publishedAt) : undefined,
      latestVersion: page.latestVersion,
      publishedVersion: page.publishedVersion
    }
  }

  async publishPageVersion(
    id: string,
    version: number,
    publishedAt: Date,
    updatedAt: Date
  ): Promise<Page | null> {
    const session = await this.getKarmaSession()

    const pageVersion = await this.getPageVersion(id, version)
    if (!pageVersion) return null

    const page = await session.do(
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
        scope('pageVersion').setField(
          'state',
          data(d => d.symbol(VersionState.Published))
        )
      ),
      get(
        update(
          refTo(scope('page')),
          scope('page')
            .setField('publishedVersion', int32(pageVersion.version))
            .setField('publishedSlug', string(pageVersion.slug))
            .setField(
              'publishedAt',
              data(d => d.dateTime(publishedAt))
            )
            .setField(
              'updatedAt',
              data(d => d.dateTime(updatedAt))
            )
        )
      )
    )

    return {
      id: page.id,
      createdAt: new Date(page.createdAt),
      updatedAt: new Date(page.updatedAt),
      publishedAt: page.publishedAt ? new Date(page.publishedAt) : undefined,
      latestVersion: page.latestVersion,
      publishedVersion: page.publishedVersion
    }
  }

  async unpublishPage(id: string): Promise<Page | null> {
    const session = await this.getKarmaSession()
    const page = await session.do(
      define('page', all(tag(ModelTag.Page))
        .filterList((index, value) => value.field('id').equal(string(id)))
        .first()),
      get(
        update(
          refTo(scope('page')),
          scope('page')
            .setField(
              'publishedVersion',
              data(d => d.null())
            )
            .setField(
              'publishedSlug',
              data(d => d.null())
            )
            .setField(
              'publishedAt',
              data(d => d.null())
            )
        )
      )
    )

    return {
      id: page.id,
      createdAt: new Date(page.createdAt),
      updatedAt: new Date(page.updatedAt),
      publishedAt: page.publishedAt ? new Date(page.publishedAt) : undefined,
      latestVersion: page.latestVersion,
      publishedVersion: page.publishedVersion
    }
  }

  async deletePage(deleteID: string): Promise<boolean | null> {
    const session = await this.getKarmaSession()

    await session.do(
      define('page', all(tag(ModelTag.Page))
        .filterList((index, value) => value.field('id').equal(string(deleteID)))
        .first()),
      delete_(refTo(scope('page'))),
      scope('page')
        .field('versions')
        .mapList((index, value) => delete_(value))
    )

    return true
  }

  async createImage(image: Image): Promise<Image> {
    const session = await this.getKarmaSession()

    await session.do(
      create(tag(ModelTag.Image), () => data(ImageModel.decode(image).toDataConstructor()))
    )

    return image
  }

  async deleteImage(deleteID: string): Promise<boolean | null> {
    const session = await this.getKarmaSession()

    await session.do(
      define('image', all(tag(ModelTag.Image))
        .filterList((index, value) => value.field('id').equal(string(deleteID)))
        .first()),
      delete_(refTo(scope('image')))
    )

    return true
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
    } catch (err) {
      console.error(err)
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
    } catch (err) {
      console.error(err)
      return null
    }
  }

  async getImagesByID(ids: readonly string[]): Promise<Array<Image | null>> {
    const images = await Promise.all(ids.map(id => this.getImage(id)))
    return ids.map(id => images.find(image => image?.id === id) ?? null)
  }

  async getImages(
    filter: string | undefined,
    pagination: Pagination
  ): Promise<[Image[], PageInfo, number]> {
    const session = await this.getKarmaSession()

    try {
      // TODO: Pagination
      let images: Image[] = await session.do(all(tag(ModelTag.Image)))

      if (filter) {
        images = images.filter(({title}) => title?.toLowerCase().includes(filter.toLowerCase()))
      }

      images.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

      return [
        images,
        {startCursor: null, endCursor: null, hasNextPage: false, hasPreviousPage: false},
        images.length
      ]
    } catch (err) {
      console.error(err)
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
    } catch (err) {
      console.error(err)
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

  async updateAuthor(author: Author): Promise<Author | null> {
    const session = await this.getKarmaSession()

    await session.do(
      update(
        refTo(
          all(tag(ModelTag.Author)).filterList((index, value) =>
            value.field('id').equal(string(author.id))
          )
        ),
        data(AuthorModel.decode(author).toDataConstructor())
      )
    )

    return author
  }

  async deleteAuthor(deleteID: string): Promise<boolean | null> {
    const session = await this.getKarmaSession()

    await session.do(
      define('author', all(tag(ModelTag.Author))
        .filterList((index, value) => value.field('id').equal(string(deleteID)))
        .first()),
      delete_(refTo(scope('author')))
    )

    return true
  }

  async getAuthor(id: string): Promise<Author | null> {
    const session = await this.getKarmaSession()

    try {
      return await session.do(
        all(tag(ModelTag.Author))
          .filterList((index, value) => value.field('id').equal(string(id)))
          .first()
      )
    } catch (err) {
      console.error(err)
      return null
    }
  }

  async getAuthors(
    filter: string,
    {after, before, first, last}: Pagination
  ): Promise<[Author[], PageInfo, number]> {
    const session = await this.getKarmaSession()
    const authors: Author[] = await session.do(all(tag(ModelTag.Author)))

    const sorted = authors
      .filter(({name}) => (filter ? name.toLowerCase().includes(filter.toLowerCase()) : true))
      .sort((a, b) => b.name.localeCompare(a.name))

    let afterIndex: number | undefined = after
      ? sorted.findIndex(({id}) => id === after)
      : undefined

    let beforeIndex: number | undefined = before
      ? sorted.findIndex(({id}) => id === before)
      : undefined

    if (afterIndex === -1) afterIndex = undefined
    if (beforeIndex === -1) beforeIndex = undefined

    const paginated = sorted.slice(
      afterIndex != undefined ? Math.min(afterIndex + 1, sorted.length) : undefined,
      beforeIndex != undefined ? Math.max(beforeIndex, 0) : undefined
    )

    if (paginated.length) {
      const limited = paginated.slice(last ? -last : 0, first)
      const startCursor = limited[0].id
      const endCursor = limited[limited.length - 1].id

      return [
        limited,
        {
          startCursor,
          endCursor,
          hasNextPage: endCursor !== sorted[sorted.length - 1].id,
          hasPreviousPage: startCursor !== sorted[0].id
        },
        authors.length
      ]
    } else {
      return [
        paginated,
        {startCursor: null, endCursor: null, hasNextPage: false, hasPreviousPage: false},
        authors.length
      ]
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

  async getUser(inputEmail: string): Promise<User | null> {
    const session = await this.getKarmaSession()

    try {
      const {id, email} = await session.do(
        all(tag(ModelTag.User))
          .filterList((index, value) => value.field('email').equal(string(inputEmail)))
          .first()
      )
      return {id, email}
    } catch (err) {
      console.error(err)
      return null
    }
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
    } catch (err) {
      console.error(err)
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

  async cleanSessions(): Promise<void> {
    const session = await this.getKarmaSession()

    await session.do(
      all(tag(ModelTag.Session))
        .filterList((index, value) =>
          value.field('expiryDate').before(data(d => d.dateTime(new Date())))
        )
        .mapList((index, value) => delete_(refTo(value)))
    )
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
    } catch (err) {
      console.error(err)
      return null
    }
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
    } catch (err) {
      console.error(err)
    }
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
