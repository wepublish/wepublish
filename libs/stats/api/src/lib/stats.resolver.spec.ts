import {Test, TestingModule} from '@nestjs/testing'
import {INestApplication, Module} from '@nestjs/common'
import request from 'supertest'
import * as crypto from 'crypto'
import {GraphQLModule} from '@nestjs/graphql'
import {ApolloDriverConfig, ApolloDriver} from '@nestjs/apollo'
import {PrismaClient, Prisma, Author, Article, ArticleRevision} from '@prisma/client'
import {PrismaModule} from '@wepublish/nest-modules'
import {StatsResolver} from './stats.resolver'
import {StatsService} from './stats.service'

export const generateRandomString = () => crypto.randomBytes(20).toString('hex')

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      path: '/',
      cache: 'bounded'
    }),
    PrismaModule
  ],
  providers: [StatsResolver, StatsService]
})
export class AppModule {}

const statsQuery = `
  query stats() {
    stats {
      articlesCount
      authorsCount
      earliestArticle
    }
  }
`

export const mockAuthors: Prisma.AuthorCreateInput[] = [
  {
    name: 'Some name',
    slug: 'some-name'
  }
]

export const mockArticles: Prisma.ArticleCreateInput[] = [
  {
    shared: true
  }
]

export const mockArticlesRevisions: Prisma.ArticleRevisionCreateInput[] = [
  {
    blocks: [],
    breaking: false,
    hideAuthor: true,
    publishedAt: new Date('02.03.2021')
  }
]

describe('StatsResolver', () => {
  let app: INestApplication
  let prisma: PrismaClient
  let authors: Author[] = []
  let articles: Article[] = []
  let articlesRevisions: ArticleRevision[] = []

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    prisma = module.get<PrismaClient>(PrismaClient)
    await prisma.author.deleteMany()
    await prisma.article.deleteMany()
    await prisma.articleRevision.deleteMany()

    app = module.createNestApplication()
    await app.init()

    authors = await Promise.all(mockAuthors.map(data => prisma.author.create({data})))
    articles = await Promise.all(mockArticles.map(data => prisma.article.create({data})))
    articlesRevisions = await Promise.all(
      mockArticlesRevisions.map(data => prisma.articleRevision.create({data}))
    )
  })

  afterAll(async () => {
    await prisma.author.deleteMany()
    await prisma.article.deleteMany()
    await prisma.articleRevision.deleteMany()
    await app.close()
  })

  test('stats query', async () => {
    await request(app.getHttpServer())
      .post('')
      .send({
        query: statsQuery,
        variables: {}
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.stats).toMatchObject({
          articlesCount: 7,
          authorsCount: 7,
          earliestArticle: 'dupa'
        })
      })
  })
})
