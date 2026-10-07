import { AuthorService } from './author.service';

describe('AuthorService cache', () => {
  const publicContentCache = { invalidate: vi.fn() };
  const author = { id: 'author-1' };
  const service = new AuthorService(
    {
      author: {
        create: vi.fn().mockResolvedValue(author),
        update: vi.fn().mockResolvedValue(author),
        delete: vi.fn().mockResolvedValue(author),
      },
    } as any,
    publicContentCache as any
  );

  beforeEach(() => {
    Object.assign(service, {
      __DATALOADER__AuthorDataloaderService: { prime: vi.fn() },
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

      expect(publicContentCache.invalidate.mock.calls[0]).toContain('authors');
    }
  );

  it('also clears cached articles after deleting an author, since lists filtered by that author change', async () => {
    await service.deleteAuthor('author-1');

    expect(publicContentCache.invalidate).toHaveBeenCalledWith(
      'authors',
      'articles'
    );
  });
});
