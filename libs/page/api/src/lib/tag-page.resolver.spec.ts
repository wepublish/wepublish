import { Test } from '@nestjs/testing';
import { createMock } from '@wepublish/testing';
import type { Tag } from '@prisma/client';
import { PageRevisionDataloaderService } from './page-revision-dataloader.service';
import { TagPageResolver } from './tag-page.resolver';

describe('TagPageResolver', () => {
  let resolver: TagPageResolver;
  let revisions: PageRevisionDataloaderService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TagPageResolver,
        {
          provide: PageRevisionDataloaderService,
          useValue: {
            ...createMock(PageRevisionDataloaderService),
            load: vi.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get(TagPageResolver);
    revisions = module.get(PageRevisionDataloaderService);
  });

  const tag = (pageId: string | null) => ({ id: 't1', pageId }) as Tag;

  it('returns no page for a tag that shows its articles', async () => {
    expect(await resolver.pageId(tag(null), false)).toBeNull();
    expect(revisions.load).not.toHaveBeenCalled();
  });

  it('returns a published page', async () => {
    vi.mocked(revisions.load).mockResolvedValue({ published: {} as never });

    expect(await resolver.pageId(tag('p1'), false)).toBe('p1');
    expect(revisions.load).toHaveBeenCalledWith('p1');
  });

  it('hides a page that is not published', async () => {
    vi.mocked(revisions.load).mockResolvedValue({ draft: {} as never });

    expect(await resolver.pageId(tag('p1'), false)).toBeNull();
  });

  it('hides a deleted page that a cached tag still points to', async () => {
    vi.mocked(revisions.load).mockResolvedValue({});

    expect(await resolver.pageId(tag('p1'), false)).toBeNull();
  });

  it('returns an unpublished page in preview mode', async () => {
    vi.mocked(revisions.load).mockResolvedValue({ draft: {} as never });

    expect(await resolver.pageId(tag('p1'), true)).toBe('p1');
  });
});
