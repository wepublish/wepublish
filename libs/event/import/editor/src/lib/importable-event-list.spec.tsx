import { ApolloClient, InMemoryCache } from '@apollo/client';
import { MockLink } from '@apollo/client/testing';
import { MockedProvider as MockedProviderBase } from '@apollo/client/testing/react';
import '@testing-library/jest-dom/vitest';
import { format } from 'date-fns';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  ImportEventDocument,
  ImportedEventListDocument,
  ImportedEventListQuery,
  ImportedEventsIdsDocument,
} from '@wepublish/editor/api';
import * as v2Client from '@wepublish/editor/api';
import { AuthContext, sessionWithPermissions } from '@wepublish/ui/editor';
import { BrowserRouter } from 'react-router-dom';
import ImportableEventListView from './importable-event-list';

vi.mock('node-fetch', () => ({ default: vi.fn() }));

const eventsMockData: ImportedEventListQuery = {
  importedEvents: {
    nodes: [
      {
        __typename: 'EventFromSource',
        id: '1',
        name: 'Event 1',
        startsAt: '2023-05-01T09:00:00.000Z',
        endsAt: '2023-05-01T17:00:00.000Z',
        externalSourceName: 'AgendaBasel',
        status: v2Client.EventStatus.Scheduled,
        imageUrl: null,
        description: null,
        externalSourceId: null,
        location: null,
      },
      {
        __typename: 'EventFromSource',
        id: '2',
        name: 'Event 2',
        startsAt: '2023-05-02T10:00:00.000Z',
        endsAt: '2023-05-02T18:00:00.000Z',
        externalSourceName: 'AgendaBasel',
        status: v2Client.EventStatus.Scheduled,
        imageUrl: null,
        description: null,
        externalSourceId: null,
        location: null,
      },
    ],
    pageInfo: {
      __typename: 'PageInfo',
      startCursor: '262707',
      endCursor: '260947',
      hasNextPage: false,
      hasPreviousPage: false,
    },
    totalCount: 2,
  },
};

const createEventMockData = {
  createEvent: 'new-event-id',
};

const mocks = [
  {
    request: {
      query: ImportedEventListDocument,
      variables: {
        filter: {},
        take: 10,
        skip: 0,
      },
    },
    result: () => {
      return {
        data: eventsMockData as ImportedEventListQuery,
      };
    },
  },
  {
    request: {
      query: ImportedEventListDocument,
      variables: {
        filter: {},
        take: 10,
        skip: 0,
      },
    },
    result: () => {
      return {
        data: eventsMockData as ImportedEventListQuery,
      };
    },
  },
  {
    request: {
      query: ImportedEventListDocument,
      variables: {
        filter: {},
        take: 10,
        skip: 0,
      },
    },
    result: () => {
      return {
        data: eventsMockData as ImportedEventListQuery,
      };
    },
  },
  {
    request: {
      query: ImportEventDocument,
      variables: {
        id: '2',
        source: 'AgendaBasel',
      },
    },
    result: () => {
      return {
        data: createEventMockData,
      };
    },
  },
  {
    request: {
      query: ImportedEventsIdsDocument,
    },
    result: () => {
      return {
        data: { importedEventsIds: ['1', '3', '4', '5'] },
      };
    },
  },
];

describe('ImportableEventListView', () => {
  beforeAll(() => {
    vi.spyOn(v2Client, 'getApiClientV2').mockReturnValue(
      new ApolloClient({
        cache: new InMemoryCache(),
        link: new MockLink(mocks, true, { showWarnings: false }),
      })
    );
  });

  test('renders the event list view with events', async () => {
    const { asFragment } = render(
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProviderBase
          mocks={mocks}
          addTypename={false}
        >
          <BrowserRouter>
            <ImportableEventListView />
          </BrowserRouter>
        </MockedProviderBase>
      </AuthContext.Provider>
    );

    // Apollo Client 4 delivers results a tick later than v3, and the view
    // issues a second query, so wait for the rows AND for the table to leave
    // its loading state — snapshotting on the rows alone is racy.
    expect(await screen.findByText('Event 1')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('grid')).toHaveAttribute('aria-busy', 'false')
    );
    // rsuite positions the table's scrollbar handle in a later layout pass;
    // snapshotting before that lands makes the inline style flap.
    await waitFor(() =>
      expect(document.querySelector('.rs-table-scrollbar-handle')).toHaveStyle({
        backfaceVisibility: 'hidden',
      })
    );

    expect(asFragment()).toMatchSnapshot();

    expect(await screen.findByText('Event 2')).toBeInTheDocument();
    expect(
      await screen.findByText(
        format(new Date('2023-05-01T09:00:00.000Z'), 'PPP p')
      )
    ).toBeInTheDocument();
    expect(
      await screen.findByText(
        format(new Date('2023-05-01T17:00:00.000Z'), 'PPP p')
      )
    ).toBeInTheDocument();
  });

  test('imports an event when import button is clicked', async () => {
    render(
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProviderBase
          mocks={mocks}
          addTypename={false}
        >
          <BrowserRouter>
            <ImportableEventListView />
          </BrowserRouter>
        </MockedProviderBase>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      fireEvent.click(screen.getAllByText('importableEvent.import')[0]);
    });

    await waitFor(() => {
      const importedButton = screen.getByText('importableEvent.imported');
      expect(importedButton).toBeInTheDocument();
    });
  });
});
