import { Test } from '@nestjs/testing';
import { AuthorDataloaderService } from '@wepublish/author/api';
import { createMock } from '@wepublish/testing';

import { BlockType } from '../block-type.model';
import { AuthorsBlock } from './authors-block.model';
import { AuthorsBlockResolver } from './authors-block.resolver';

const author = (id: string) => ({ id, name: `Person ${id}` });

describe('AuthorsBlockResolver', () => {
  let resolver: AuthorsBlockResolver;
  let dataloader: { loadMany: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    dataloader = createMock(AuthorDataloaderService) as typeof dataloader;
    // every id but "deleted" still has its author
    dataloader.loadMany.mockImplementation(async (ids: string[]) =>
      ids.map(id => (id === 'deleted' ? null : author(id)))
    );

    const module = await Test.createTestingModule({
      providers: [
        AuthorsBlockResolver,
        { provide: AuthorDataloaderService, useValue: dataloader },
      ],
    }).compile();

    resolver = await module.resolve(AuthorsBlockResolver);
  });

  const block = (authorIds?: string[]) =>
    ({ type: BlockType.Authors, title: 'Team', authorIds }) as AuthorsBlock;

  describe('authors', () => {
    it('resolves the chosen authors in the chosen order', async () => {
      expect(await resolver.authors(block(['b', 'a', 'c']))).toEqual([
        author('b'),
        author('a'),
        author('c'),
      ]);
    });

    it('leaves out authors that no longer exist', async () => {
      expect(await resolver.authors(block(['a', 'deleted', 'b']))).toEqual([
        author('a'),
        author('b'),
      ]);
    });

    it('is empty without any chosen author', async () => {
      expect(await resolver.authors(block())).toEqual([]);
      expect(dataloader.loadMany).not.toHaveBeenCalled();
    });
  });

  describe('authorIds', () => {
    it('keeps only the ids of authors that still exist', async () => {
      expect(await resolver.authorIds(block(['a', 'deleted', 'b']))).toEqual([
        'a',
        'b',
      ]);
    });
  });
});
