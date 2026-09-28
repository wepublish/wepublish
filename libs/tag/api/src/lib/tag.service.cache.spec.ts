import { TagService } from './tag.service';

describe('TagService cache', () => {
  const publicContentCache = { invalidate: vi.fn() };
  const tag = { id: 'tag-1' };
  const service = new TagService(
    {
      tag: {
        create: vi.fn().mockResolvedValue(tag),
        update: vi.fn().mockResolvedValue(tag),
        delete: vi.fn().mockResolvedValue(tag),
      },
    } as any,
    publicContentCache as any
  );

  beforeEach(() => {
    Object.assign(service, {
      __DATALOADER__TagDataloader: { prime: vi.fn() },
    });
    publicContentCache.invalidate.mockReset().mockResolvedValue(undefined);
  });

  it.each<[string, () => Promise<unknown>]>([
    ['creating', () => service.createTag({ tag: 'a', type: 'Article' } as any)],
  ])('clears cached answers after %s a tag', async (_, change) => {
    await change();

    expect(publicContentCache.invalidate).toHaveBeenCalled();
  });

  it('clears cached articles after renaming a tag', async () => {
    await service.updateTag({ id: 'tag-1' } as any);

    expect(publicContentCache.invalidate).toHaveBeenCalledWith('articles');
  });

  it('clears cached article and page lists after deleting a tag', async () => {
    await service.deleteTag('tag-1');

    expect(publicContentCache.invalidate).toHaveBeenCalledWith(
      'articles',
      'pages'
    );
  });
});
