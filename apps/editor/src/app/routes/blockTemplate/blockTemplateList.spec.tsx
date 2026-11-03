import '@testing-library/jest-dom/vitest';

import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { renderWithTheme } from '../templates/testUtils';
import { BlockTemplateList } from './blockTemplateList';

const listQuery = vi.hoisted(() => vi.fn());

vi.mock('@apollo/client/react', async importOriginal => {
  const { routeApolloByOperation } = await import('../templates/testUtils');

  return routeApolloByOperation(await importOriginal(), {
    queries: { BlockTemplateList: options => listQuery(options) },
  });
});

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...((await importOriginal()) as object),
  createCheckedPermissionComponent:
    () =>
    <T,>(component: T) =>
      component,
}));

vi.mock(
  'react-i18next',
  async () => (await import('../templates/testUtils')).translationMock
);

const blockTemplate = (
  id: string,
  name: string,
  puckBlocks: { id: string }[] | null
) => ({
  __typename: 'BlockTemplate',
  id,
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  name,
  blocks: [],
  puckBlocks,
});

beforeEach(() => {
  listQuery.mockReturnValue({
    data: {
      blockTemplates: {
        nodes: [
          blockTemplate('legacy-1', 'Legacy', null),
          blockTemplate('puck-1', 'Built', []),
        ],
        totalCount: 2,
      },
    },
    loading: false,
    refetch: vi.fn(),
  });
});

const renderList = () =>
  renderWithTheme(
    <MemoryRouter>
      <BlockTemplateList />
    </MemoryRouter>
  );

describe('BlockTemplateList', () => {
  it('opens block templates of the block editor in the block editor', async () => {
    renderList();

    expect(await screen.findByRole('link', { name: 'Legacy' })).toHaveAttribute(
      'href',
      '/block-content/templates/edit/legacy-1'
    );
  });

  it('opens block templates built in the page builder in the page builder', async () => {
    renderList();

    expect(await screen.findByRole('link', { name: 'Built' })).toHaveAttribute(
      'href',
      '/puck/templates/blocks/edit/puck-1'
    );
  });

  it('creates new block templates in the page builder', async () => {
    renderList();

    expect(
      await screen.findByRole('link', {
        name: /blockTemplates.list.newBlockTemplate/,
      })
    ).toHaveAttribute('href', '/puck/templates/blocks/create');
  });
});
