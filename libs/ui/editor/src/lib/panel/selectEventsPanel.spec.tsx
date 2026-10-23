import { useApolloClient, useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { EventListDocument } from '@wepublish/editor/api';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';

import { SelectEventPanel } from './selectEventsPanel';

const theme = createTheme({ cssVariables: true });

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useApolloClient: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as Mock;
const mockedUseApolloClient = useApolloClient as unknown as Mock;

const event = {
  __typename: 'Event' as const,
  id: 'event-1',
  slug: 'konzert',
  name: 'Konzert',
  description: null,
  status: 'Confirmed',
  scheduleType: 'Continuous',
  location: null,
  image: null,
  tags: [],
  startsAt: null,
  endsAt: null,
  createdAt: '2026-10-01T00:00:00.000Z',
  modifiedAt: '2026-10-01T00:00:00.000Z',
  url: null,
};

const eventListCalls = () =>
  mockedUseQuery.mock.calls.filter(
    ([document]) => document === EventListDocument
  );

beforeEach(() => {
  mockedUseQuery.mockReset();
  mockedUseApolloClient.mockReturnValue({
    query: vi.fn().mockResolvedValue({ data: {} }),
  });
  mockedUseQuery.mockImplementation(document =>
    document === EventListDocument ?
      {
        data: { events: { nodes: [event], totalCount: 1 } },
        loading: false,
      }
    : { data: undefined, loading: false, refetch: vi.fn() }
  );
});

const renderPanel = () =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <SelectEventPanel
          selectedFilter={{ tags: ['tag-1'] }}
          onClose={vi.fn()}
          onSelect={vi.fn()}
        />
      </MemoryRouter>
    </ThemeProvider>
  );

describe('SelectEventPanel', () => {
  it('filters the event list by tagIds', () => {
    renderPanel();

    expect(eventListCalls().at(-1)?.[1]?.variables?.filter).toEqual({
      tagIds: ['tag-1'],
    });
  });

  it('lists the event without linking to the removed edit route', () => {
    const { container } = renderPanel();

    expect(screen.getByText('Konzert')).toBeTruthy();
    expect(container.querySelector('a[href*="/events/edit"]')).toBeNull();
  });
});
