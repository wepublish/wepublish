import {render, screen, fireEvent, waitFor} from '@testing-library/react'
import {MockedProvider as MockedProviderBase} from '@apollo/client/testing'
import '@testing-library/jest-dom'
import {ImportableEventListView} from './importable-event-list'
import {format} from 'date-fns'
import {BrowserRouter} from 'react-router-dom'
import {ImportedEventListDocument, ImportedEventListQuery} from '@wepublish/editor/api-v2'
import {actWait, sessionWithPermissions} from '@wepublish/ui/editor'
import {AuthContext} from '@wepublish/ui/editor'
import {CreateEventDocument, ImportedEventsIdsDocument} from '@wepublish/editor/api'
import fetch from 'jest-fetch-mock'
jest.setMock('node-fetch', fetch)

jest.mock('../apiClientv2', () => ({
  getApiClientV2: jest.fn()
}))

const MockedProvider = MockedProviderBase as any

const eventsMockData = {
  importedEvents: {
    nodes: [
      {
        __typename: 'Query',
        id: '1',
        name: 'Event 1',
        startsAt: '2023-05-01T09:00:00.000Z',
        endsAt: '2023-05-01T17:00:00.000Z',
        externalSourceName: 'AgendaBasel'
      },
      {
        __typename: 'Query',
        id: '2',
        name: 'Event 2',
        startsAt: '2023-05-02T10:00:00.000Z',
        endsAt: '2023-05-02T18:00:00.000Z',
        externalSourceName: 'AgendaBasel'
      }
    ],
    pageInfo: {
      __typename: 'PageInfo',
      startCursor: '262707',
      endCursor: '260947',
      hasNextPage: false,
      hasPreviousPage: false
    },
    totalCount: 2
  }
}

const createEventMockData = {
  createEvent: 'new-event-id'
}

const mocks = [
  {
    request: {
      query: ImportedEventListDocument,
      variables: {
        take: 10,
        skip: 0
      }
    },
    result: () => {
      return {
        data: eventsMockData as ImportedEventListQuery
      }
    }
  },
  {
    request: {
      query: CreateEventDocument,
      variables: {
        id: '1',
        source: 'AgendaBasel'
      }
    },
    result: () => {
      return {
        data: createEventMockData
      }
    }
  },
  {
    request: {
      query: ImportedEventsIdsDocument,
      variables: {}
    },
    result: () => {
      return {
        data: {importedEventsIds: ['1', '3', '4', '5']}
      }
    }
  }
]

describe('ImportableEventListView', () => {
  test('renders the event list view with events', async () => {
    render(
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProvider mocks={mocks} addTypename={false}>
          <BrowserRouter>
            <ImportableEventListView />
          </BrowserRouter>
        </MockedProvider>
      </AuthContext.Provider>
    )

    await actWait()

    await waitFor(() => {
      expect(screen.getByText('Event 1')).toBeInTheDocument()
      expect(screen.getByText('Event 2')).toBeInTheDocument()
    })
  })

  test('displays the startsAt and endsAt of the events', async () => {
    render(
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProvider mocks={mocks} addTypename={false}>
          <BrowserRouter>
            <ImportableEventListView />
          </BrowserRouter>
        </MockedProvider>
      </AuthContext.Provider>
    )

    await waitFor(() => {
      const startsAt1 = screen.getByText(format(new Date('2023-05-01T09:00:00.000Z'), 'PPP p'))
      const endsAt1 = screen.getByText(format(new Date('2023-05-01T17:00:00.000Z'), 'PPP p'))
      const startsAt2 = screen.getByText(format(new Date('2023-05-02T10:00:00.000Z'), 'PPP p'))
      const endsAt2 = screen.getByText(format(new Date('2023-05-02T18:00:00.000Z'), 'PPP p'))

      expect(startsAt1).toBeInTheDocument()
      expect(endsAt1).toBeInTheDocument()
      expect(startsAt2).toBeInTheDocument()
      expect(endsAt2).toBeInTheDocument()
    })
  })

  test('imports an event when import button is clicked', async () => {
    render(
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProvider mocks={mocks} addTypename={false}>
          <BrowserRouter>
            <ImportableEventListView />
          </BrowserRouter>
        </MockedProvider>
      </AuthContext.Provider>
    )

    await waitFor(() => {
      fireEvent.click(screen.getAllByText('importableEvent.import')[0])
    })

    await waitFor(() => {
      const importedButton = screen.getByText('importableEvent.imported')
      expect(importedButton).toBeInTheDocument()
    })
  })
})
