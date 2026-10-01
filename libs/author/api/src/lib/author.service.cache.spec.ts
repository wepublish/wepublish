import { AuthorService } from './author.service';

describe('AuthorService cache', () => {
  const publicContentCache = { invalidate: jest.fn() };
  const author = { id: 'author-1' };
  const service = new AuthorService(
    {
      author: {
        create: jest.fn().mockResolvedValue(author),
        update: jest.fn().mockResolvedValue(author),
        delete: jest.fn().mockResolvedValue(author),
      },
    } as any,
    publicContentCache as any
  );

  beforeEach(() => {
    Object.assign(service, {
      __DATALOADER__AuthorDataloaderService: { prime: jest.fn() },
    });
    publicContentCache.invalidate.mockReset().mockResolvedValue(undefined);
  });

  it.each<[string, () => Promise<unknown>]>([
    [
      'creating',
      () => service.createAuthor({ name: 'A', slug: 'a', tagIds: [] } as any),
    ],
    ['updating', () => service.updateAuthor({ id: 'author-1' } as any)],
    ['deleting', () => service.deleteAuthor('author-1')],
  ])(
    'clears cached authors and answers after %s an author',
    async (_, change) => {
      await change();

      expect(publicContentCache.invalidate).toHaveBeenCalledWith('authors');
    }
  );
});
