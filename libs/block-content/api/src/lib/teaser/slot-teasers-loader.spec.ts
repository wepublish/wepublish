import { Test, TestingModule } from '@nestjs/testing';
import { SlotTeasersLoader } from './slot-teasers-loader';
import { BlockType } from '../block-type.model';
import { BaseBlock } from '../base-block.model';
import { EventService } from '@wepublish/event/api';
import { ArticleService } from '@wepublish/article/api';
import {
  ArticleTeaser,
  FlexBlock,
  TeaserSlotsBlock,
} from '@wepublish/website/api';
import { TeaserType } from './teaser.model';
import { BlockWithAlignment } from '../flex/flex-block.model';
import nanoid from 'nanoid';
import { TeaserSlotType } from '../teaser-slot/teaser-slot.model';

jest.mock('i18n-iso-countries', () => ({
  default: jest.fn(),
  registerLocale: jest.fn(),
  getNames: jest.fn().mockResolvedValue({ DE: 'Deutsch' }),
}));
jest.mock('nanoid', () => {
  let counter = -1;
  return () => {
    counter++;
    return `mock_nanoid_${counter}`;
  };
});

const mockFlexBock = ({
  blockStyle = null,
  blocks = [] as BlockWithAlignment[],
} = {}) =>
  ({
    type: BlockType.FlexBlock,
    blockStyle,
    blocks,
  }) as unknown as FlexBlock;

const mockTeaserSlotsBlock = () => {
  return {
    autofillConfig: {
      __typename: 'TeaserSlotsBlockAutofillConfig',
      tagIds: [],
      enabled: true,
      numberOfTeasers: 8,
      sort: null,
      teaserType: 'article' as TeaserType.Article, // Explicit lowercase string to match enum value
      filter: {
        __typename: 'TeaserListBlockFilter',
        tags: ['test-tag-id'],
        tagObjects: [
          {
            __typename: 'Tag',
            id: nanoid(),
            tag: `lorem-ipsum`,
          },
        ],
      },
    },
    slots: [
      {
        type: TeaserSlotType.Manual,
        teaser: {
          type: TeaserType.Article,
          article: {
            id: `article_${nanoid()}`,
          },
        } as ArticleTeaser,
      },
      {
        type: TeaserSlotType.Autofill,
      },
      {
        type: TeaserSlotType.Autofill,
      },
      {
        type: TeaserSlotType.Autofill,
      },
      {
        type: TeaserSlotType.Autofill,
      },
      {
        type: TeaserSlotType.Autofill,
      },
      {
        type: TeaserSlotType.Autofill,
      },
      {
        type: TeaserSlotType.Autofill,
      },
      {
        type: TeaserSlotType.Autofill,
      },
    ],
    type: BlockType.TeaserSlots,
  } as unknown as TeaserSlotsBlock;
};

const mockNestedBlock = ({
  alignment = {
    i: nanoid(),
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    static: false,
  },
  block = mockTeaserSlotsBlock(),
} = {}) =>
  ({
    alignment,
    block,
  }) as unknown as BlockWithAlignment;

const revisionBlocks: BaseBlock<BlockType>[] = [
  mockFlexBock({
    blocks: [
      mockNestedBlock({ block: mockTeaserSlotsBlock() }),
      mockNestedBlock({ block: mockTeaserSlotsBlock() }),
      mockNestedBlock({ block: mockTeaserSlotsBlock() }),
      mockNestedBlock({ block: mockTeaserSlotsBlock() }),
      mockNestedBlock({ block: mockTeaserSlotsBlock() }),
      mockNestedBlock({ block: mockTeaserSlotsBlock() }),
      mockNestedBlock({ block: mockTeaserSlotsBlock() }),
    ],
  }),
  mockFlexBock({
    blocks: [
      mockNestedBlock({ block: mockTeaserSlotsBlock() }),
      mockNestedBlock({ block: mockTeaserSlotsBlock() }),
      mockNestedBlock({ block: mockTeaserSlotsBlock() }),
      mockNestedBlock({ block: mockTeaserSlotsBlock() }),
      mockNestedBlock({ block: mockTeaserSlotsBlock() }),
      mockNestedBlock({ block: mockTeaserSlotsBlock() }),
      mockNestedBlock({ block: mockTeaserSlotsBlock() }),
    ],
  }),
] as unknown as BaseBlock<BlockType>[];

const mockEventService = {
  getEvents: jest.fn().mockResolvedValue({ nodes: [] }),
};

// simulate database with a fixed pool of articles
const ARTICLE_POOL = Array.from({ length: 100 }, (_, i) => ({
  id: `article_pool_${i + 1}`,
  title: `Article ${i + 1}`,
}));

const mockArticleService = {
  getArticles: jest.fn().mockImplementation(async ({ take, filter }) => {
    const excludedIds = filter?.excludeIds || [];

    // simulate async database delay with random timing to expose race conditions while loading teasers
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50));

    // simulate database: return articles from pool that are NOT in excludeIds
    const availableArticles = ARTICLE_POOL.filter(
      a => !excludedIds.includes(a.id)
    );
    const articles = availableArticles.slice(0, take);

    return { nodes: articles };
  }),
};

describe('SlotTeasersLoader', () => {
  let service: SlotTeasersLoader;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlotTeasersLoader,
        { provide: EventService, useValue: mockEventService },
        { provide: ArticleService, useValue: mockArticleService },
      ],
    }).compile();

    service = await module.resolve<SlotTeasersLoader>(SlotTeasersLoader);
  });

  it('should return unique teasers', async () => {
    const result = await service.loadSlotTeasersIntoBlocks(revisionBlocks);

    const unique = (x: string, i: number, arr: string[]) =>
      arr.indexOf(x) === i;

    const fB = result[0] as unknown as FlexBlock;
    const shouldBeUniqueTeaserIds: string[] = [];
    for (const nestedBlock of fB.blocks) {
      const block = (nestedBlock as BlockWithAlignment)
        .block as TeaserSlotsBlock;

      for (const t of block.teasers) {
        if (t && t.type === TeaserType.Article) {
          const teaser = t as ArticleTeaser;
          const id = teaser.article?.id || teaser.articleID;
          if (id) {
            shouldBeUniqueTeaserIds.push(id);
          }
        }
      }
    }

    //console.log('shouldBeUniqueTeaserIds:', shouldBeUniqueTeaserIds);

    const filteredTeaserIds = shouldBeUniqueTeaserIds.filter(unique);
    expect(filteredTeaserIds).toEqual(shouldBeUniqueTeaserIds);
    expect(result).toMatchSnapshot();
  });
});
