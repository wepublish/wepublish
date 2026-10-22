import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  ArticleListDocument,
  EventListDocument,
  PageListDocument,
  TeaserType,
} from '@wepublish/editor/api';

import { TeaserSelectPanel } from './teaserSelectPanel';

const theme = createTheme({ cssVariables: true });

const pageInfo = { hasNextPage: false, endCursor: null };

const article = {
  id: 'a1',
  createdAt: '2026-10-20T15:50:00.000Z',
  modifiedAt: '2026-10-20T15:54:00.000Z',
  draft: null,
  pending: null,
  published: { id: 'r1' },
  latest: { title: 'Hallo Welt', image: null },
};

let events: unknown[] = [];

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<object>()),
  useQuery: (document: unknown) => {
    if (document === ArticleListDocument) {
      return { data: { articles: { nodes: [article], pageInfo } } };
    }
    if (document === PageListDocument) {
      return { data: { pages: { nodes: [], pageInfo } } };
    }
    if (document === EventListDocument) {
      return { data: { events: { nodes: events, pageInfo } } };
    }
    return { data: undefined };
  },
}));

const renderPanel = () => {
  const onSelect = vi.fn();

  render(
    <MockedProvider>
      <ThemeProvider theme={theme}>
        <TeaserSelectPanel
          onClose={vi.fn()}
          onSelect={onSelect}
        />
      </ThemeProvider>
    </MockedProvider>
  );

  return onSelect;
};

describe('TeaserSelectPanel', () => {
  beforeEach(() => {
    events = [];
  });

  it('chooses an article by clicking anywhere on its row', () => {
    const onSelect = renderPanel();

    fireEvent.click(screen.getByRole('button', { name: /Hallo Welt/ }));

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ type: TeaserType.Article, article })
    );
  });

  it('labels the search field', () => {
    renderPanel();

    expect(
      screen.getByRole('textbox', { name: 'articleEditor.panels.search' })
    ).toBeInTheDocument();
  });

  it('keeps the upcoming filter reachable when no events match', () => {
    renderPanel();

    fireEvent.click(
      screen.getByRole('tab', { name: /resources.teaserType.event/ })
    );

    expect(
      screen.getByRole('checkbox', { name: 'event.list.upcomingOnly' })
    ).toBeChecked();
  });

  it('shows a translated event status', () => {
    events = [
      {
        id: 'e1',
        name: 'Exkursion',
        startsAt: '2026-11-03T15:38:00.000Z',
        status: 'Scheduled',
        image: null,
      },
    ];
    renderPanel();

    fireEvent.click(
      screen.getByRole('tab', { name: /resources.teaserType.event/ })
    );

    expect(
      screen.getByRole('button', { name: /event\.form\.scheduled/ })
    ).toBeInTheDocument();
  });

  it('keeps open in new tab off for a new custom teaser unless ticked', () => {
    const onSelect = renderPanel();

    fireEvent.click(
      screen.getByRole('tab', { name: /resources.teaserType.custom/ })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'articleEditor.panels.confirm' })
    );

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        type: TeaserType.Custom,
        openInNewTab: false,
      })
    );
  });
});
