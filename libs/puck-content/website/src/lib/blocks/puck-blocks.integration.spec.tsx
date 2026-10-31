import { screen, within } from '@testing-library/react';
import {
  mockArticle,
  mockArticleRevision,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  FullPuckBlockFragment,
  PuckBlockKind,
  PuckDatasourceType,
} from '@wepublish/website/api';

import { emptyPuckBlockData, PuckBlockData } from './block.types';
import { PuckBlocks } from './puck-blocks-renderer.component';

type Datasources = NonNullable<FullPuckBlockFragment['datasources']>;

const articleDatasource = (type: PuckDatasourceType): Datasources => ({
  __typename: 'PuckBlockDatasources',
  article: { __typename: 'PuckBlockDatasource', type },
  page: null,
  event: null,
  image: null,
  memberPlan: null,
  userSubscription: null,
});

const blockData = (
  data: Partial<PuckBlockData> = {}
): FullPuckBlockFragment['data'] => ({
  __typename: 'PuckBlockData',
  ...emptyPuckBlockData,
  ...data,
});

const block = (
  fields: Pick<FullPuckBlockFragment, 'id' | 'type'> &
    Partial<FullPuckBlockFragment>
): FullPuckBlockFragment => ({
  __typename: 'PuckBlock',
  kind: PuckBlockKind.Puck,
  parentId: null,
  puckSlot: null,
  position: 0,
  props: {},
  visibility: null,
  styling: null,
  datasources: null,
  data: blockData(),
  ...fields,
});

const articles = ['First story', 'Second story', 'Third story'].map(
  (title, index) =>
    mockArticle({
      id: `article-${index}`,
      latest: mockArticleRevision({ title, blocks: [] }),
    })
);

const teaserGrid: FullPuckBlockFragment[] = [
  block({
    id: 'grid',
    type: 'Grid',
    props: { layout: { xs: { columns: [1, 1, 1] } }, content: [] },
    datasources: articleDatasource(PuckDatasourceType.UniqueList),
    data: blockData({ articles }),
  }),
  ...articles.flatMap((article, index) => [
    block({
      id: `container-${index}`,
      type: 'Container',
      parentId: 'grid',
      puckSlot: 'content',
      position: index,
      props: { content: [] },
      datasources: articleDatasource(PuckDatasourceType.Slot),
      data: blockData({ articles: [article] }),
    }),
    block({
      id: `title-${index}`,
      type: 'TeaserTitle',
      parentId: `container-${index}`,
      puckSlot: 'content',
      position: 0,
    }),
  ]),
];

describe('PuckBlocks with the website blocks', () => {
  it('shows the article each container takes from the grid as its teaser title', () => {
    const { container } = renderWithProviders(
      <PuckBlocks blocks={teaserGrid} />
    );

    expect(
      screen
        .getAllByRole('heading', { level: 2 })
        .map(title => title.textContent)
    ).toEqual(['First story', 'Second story', 'Third story']);

    const grid = container.firstElementChild;

    expect(grid).toHaveStyle({ display: 'grid' });
    expect(grid?.childElementCount).toBe(3);

    for (const [index, cell] of [...(grid?.children ?? [])].entries()) {
      expect(
        within(cell as HTMLElement).getByRole('heading', { level: 2 })
      ).toHaveTextContent(articles[index].latest.title ?? '');
    }
  });

  it('shows no title in a container the grid has no article left for', () => {
    renderWithProviders(
      <PuckBlocks
        blocks={[
          ...teaserGrid,
          block({
            id: 'container-3',
            type: 'Container',
            parentId: 'grid',
            puckSlot: 'content',
            position: 3,
            props: { content: [] },
            datasources: articleDatasource(PuckDatasourceType.Slot),
            data: blockData({ articles: [] }),
          }),
          block({
            id: 'title-3',
            type: 'TeaserTitle',
            parentId: 'container-3',
            puckSlot: 'content',
            position: 0,
          }),
        ]}
      />
    );

    expect(
      screen
        .getAllByRole('heading', { level: 2 })
        .map(title => title.textContent)
    ).toEqual(['First story', 'Second story', 'Third story']);
  });
});
