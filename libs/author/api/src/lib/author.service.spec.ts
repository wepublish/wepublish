import {Test, TestingModule} from '@nestjs/testing'
import {AuthorService} from './author.service'
import {PrismaClient} from '@prisma/client'
import {AuthorDataloader} from './author-dataloader'
import {SortOrder} from '@wepublish/utils/api'
import {AuthorSort} from './author.model'

describe('AuthorService', () => {
  let service: AuthorService
  let dataloader: {[method in keyof AuthorDataloader]?: jest.Mock}
  let prismaMock: any

  beforeEach(async () => {
    prismaMock = {
      author: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn()
      }
    }

    dataloader = {
      prime: jest.fn()
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorService,
        {provide: AuthorDataloader, useValue: dataloader},
        {provide: PrismaClient, useValue: prismaMock}
      ]
    }).compile()

    service = module.get<AuthorService>(AuthorService)
  })

  it('should get an author by id', async () => {
    prismaMock.author.findUnique.mockResolvedValueOnce({
      id: '123',
      name: 'testAuthor',
      slug: 'test-author',
      links: []
    })
    await service.getAuthorById('123')
    expect(prismaMock.author.findUnique).toHaveBeenCalled()
    expect(prismaMock.author.findUnique.mock.calls[0]).toMatchSnapshot()
    expect(dataloader.prime).toHaveBeenCalled()
  })

  it('should get an author by slug', async () => {
    prismaMock.author.findUnique.mockResolvedValueOnce({
      id: '123',
      name: 'testAuthor',
      slug: 'test-author',
      links: []
    })
    await service.getAuthorBySlug('test-author')
    expect(prismaMock.author.findUnique).toHaveBeenCalled()
    expect(prismaMock.author.findUnique.mock.calls[0]).toMatchSnapshot()
    expect(dataloader.prime).toHaveBeenCalled()
  })

  it('should get authors with pagination', async () => {
    prismaMock.author.count.mockResolvedValueOnce(2)
    prismaMock.author.findMany.mockResolvedValueOnce([
      {
        id: '123',
        name: 'testAuthor',
        slug: 'test-author',
        links: []
      },
      {
        id: '234',
        name: 'anotherAuthor',
        slug: 'another-author',
        links: []
      }
    ])
    const args = {
      filter: {name: 'test'},
      sortedField: AuthorSort.Name,
      order: SortOrder.Ascending,
      skip: 0,
      take: 2
    }
    await service.getAuthors(args)
    expect(prismaMock.author.count).toHaveBeenCalled()
    expect(prismaMock.author.findMany).toHaveBeenCalled()
    expect(prismaMock.author.findMany.mock.calls[0]).toMatchSnapshot()
    expect(dataloader.prime).toHaveBeenCalled()
  })

  it('should create an author', async () => {
    const author = {
      name: 'testAuthor',
      slug: 'test-author',
      links: [],
      tagIds: []
    }
    prismaMock.author.create.mockResolvedValueOnce(author)
    await service.createAuthor(author)
    expect(prismaMock.author.create).toHaveBeenCalled()
    expect(prismaMock.author.create.mock.calls[0]).toMatchSnapshot()
  })

  it('should update an author', async () => {
    const author = {
      id: '123',
      name: 'updatedAuthor',
      slug: 'updated-author',
      links: [],
      tagIds: []
    }
    prismaMock.author.update.mockResolvedValueOnce(author)
    await service.updateAuthor(author)
    expect(prismaMock.author.update).toHaveBeenCalled()
    expect(prismaMock.author.update.mock.calls[0]).toMatchSnapshot()
    expect(dataloader.prime).toHaveBeenCalled()
  })

  it('should delete an author by id', async () => {
    prismaMock.author.delete.mockResolvedValueOnce({
      id: '123',
      name: 'deletedAuthor',
      slug: 'deleted-author',
      links: []
    })
    await service.deleteAuthorById('123')
    expect(prismaMock.author.delete).toHaveBeenCalled()
    expect(prismaMock.author.delete.mock.calls[0]).toMatchSnapshot()
    expect(dataloader.prime).not.toHaveBeenCalled()
  })
})
