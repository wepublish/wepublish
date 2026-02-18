import { ApolloClient, InMemoryCache } from '@apollo/client';
import {
  MockLink,
  MockedProvider as MockedProviderBase,
} from '@apollo/client/testing';
import '@testing-library/jest-dom';
import { format } from 'date-fns';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  CreateEventDocument,
  ImportedEventsIdsDocument,
} from '@wepublish/editor/api';
import * as v2Client from '@wepublish/editor/api';
import {
  ImportedEventListDocument,
  ImportedEventListQuery,
} from '@wepublish/editor/api';
import {
  AuthContext,
  actWait,
  sessionWithPermissions,
} from '@wepublish/ui/editor';
import fetch from 'jest-fetch-mock';
import { BrowserRouter } from 'react-router-dom';
import ImportableEventListView from './importable-event-list';

jest.setMock('node-fetch', fetch);

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
      query: CreateEventDocument,
      variables: {
        id: '1',
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
      variables: {},
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
    jest.spyOn(v2Client, 'getApiClientV2').mockReturnValue(
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

    await actWait();

    expect(asFragment()).toMatchSnapshot();

    expect(await screen.findByText('Event 1')).toBeInTheDocument();
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
