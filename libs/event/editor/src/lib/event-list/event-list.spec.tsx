import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import {
  DeleteEventDocument,
  EditorEventListDocument,
  EventSort,
  SortOrder,
  TinyOrganizationListDocument,
  UnpublishEventDocument,
} from '@wepublish/editor/api';
import {
  CanCreateEvent,
  CanDeleteEvent,
  CanGetEvents,
  CanPublishEvent,
} from '@wepublish/permissions';
import type { Mock } from 'vitest';

import { EventList } from './event-list';
import { listItem, renderWith } from './test-helpers';

vi.mock('react-i18next', async () =>
  (await import('./test-translate')).i18nMock()
);

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useLazyQuery: vi.fn(() => [vi.fn(), { data: undefined }]),
  useMutation: vi.fn(),
  useApolloClient: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as Mock;
const mockedUseMutation = useMutation as unknown as Mock;
const mockedUseApolloClient = useApolloClient as unknown as Mock;

const ORGANISER = [CanGetEvents.id, CanCreateEvent.id];
const EDITOR = [
  CanGetEvents.id,
  CanCreateEvent.id,
  CanPublishEvent.id,
  CanDeleteEvent.id,
];

let events = [listItem()];
let memberships = 1;
const unpublishEvent = vi.fn();
const deleteEvent = vi.fn();
const refetch = vi.fn();

beforeEach(() => {
  localStorage.clear();
  events = [listItem()];
  memberships = 1;
  unpublishEvent.mockReset().mockResolvedValue({});
  deleteEvent.mockReset().mockResolvedValue({});
  refetch.mockReset();
  mockedUseQuery.mockReset();
  mockedUseApolloClient.mockReturnValue({
    query: vi.fn().mockResolvedValue({ data: {} }),
  });
  mockedUseQuery.mockImplementation(document => {
    if (document === EditorEventListDocument) {
      return {
        data: { events: { nodes: events, totalCount: events.length } },
        loading: false,
        refetch,
      };
    }

    if (document === TinyOrganizationListDocument) {
      return {
        data: { organizations: { nodes: [], totalCount: memberships } },
        loading: false,
      };
    }

    return { data: undefined, loading: false };
  });
  mockedUseMutation.mockImplementation(document => [
    document === UnpublishEventDocument ? unpublishEvent
    : document === DeleteEventDocument ? deleteEvent
    : vi.fn(),
    { loading: false },
  ]);
});

const renderList = ({
  permissions = EDITOR,
  route = '/events',
}: { permissions?: string[]; route?: string } = {}) =>
  render(renderWith(<EventList />, { permissions, route }));

const lastListCall = () =>
  mockedUseQuery.mock.calls
    .filter(([document]) => document === EditorEventListDocument)
    .at(-1)?.[1];

describe('EventList', () => {
  it('asks for the editor view of the events, latest change first', () => {
    renderList();

    const options = lastListCall();

    expect(options?.context).toBeUndefined();
    expect(options?.variables).toMatchObject({
      filter: {},
      take: 10,
      skip: 0,
      sort: EventSort.ModifiedAt,
      order: SortOrder.Descending,
    });
  });

  it('turns on the review queue from the filters, oldest request first', () => {
    renderList();

    fireEvent.click(
      screen.getByRole('button', { name: 'filterableList.filter.label' })
    );
    fireEvent.click(
      screen.getByRole('switch', {
        name: 'agenda.list.filter.reviewRequested',
      })
    );

    expect(lastListCall()?.variables).toMatchObject({
      filter: { reviewRequested: true },
      sort: EventSort.ReviewRequestedAt,
      order: SortOrder.Ascending,
    });
  });

  it('opens the review queue from the dashboard link, whatever filter was stored', () => {
    localStorage.setItem(
      'wepublish:editor:listState:events',
      JSON.stringify({
        filter: { search: 'jazz' },
        sortField: 'createdAt',
        sortOrder: 'desc',
        limit: 25,
      })
    );

    renderList({ route: '/events?review=1' });

    expect(lastListCall()?.variables).toMatchObject({
      filter: { reviewRequested: true },
      sort: EventSort.ReviewRequestedAt,
      order: SortOrder.Ascending,
      take: 25,
    });
  });

  it('shows the venue, the organisation and the status of each event', () => {
    renderList();

    expect(screen.getByText('Qui-vive')).toBeTruthy();
    expect(screen.getByText('Nuithonie')).toBeTruthy();
    expect(screen.getByText('Equilibre')).toBeTruthy();
    expect(screen.getByText('agenda.status.Confirmed')).toBeTruthy();
  });

  it('does not link to the event editor, which does not exist yet', () => {
    const { container } = renderList();

    expect(container.querySelector('a[href*="/events/"]')).toBeNull();
  });

  it('offers unpublish and delete where viewerCan allows them', () => {
    events = [
      listItem({
        published: {
          __typename: 'EventRevision',
          id: 'rev-0',
          publishedAt: '2026-10-01T00:00:00.000Z',
        },
      }),
    ];

    renderList();

    expect(
      screen.getByRole('button', { name: 'agenda.list.unpublish' })
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'delete' })).toBeTruthy();
  });

  it('hides unpublish and delete where viewerCan says no', () => {
    events = [
      listItem({
        published: {
          __typename: 'EventRevision',
          id: 'rev-0',
          publishedAt: '2026-10-01T00:00:00.000Z',
        },
        viewerCan: {
          __typename: 'EventViewerPermissions',
          update: true,
          publish: false,
          delete: false,
          duplicate: false,
        },
      }),
    ];

    renderList();

    expect(
      screen.queryByRole('button', { name: 'agenda.list.unpublish' })
    ).toBeNull();
    expect(screen.queryByRole('button', { name: 'delete' })).toBeNull();
  });

  it('offers no unpublish for a draft that was never published', () => {
    renderList();

    expect(
      screen.queryByRole('button', { name: 'agenda.list.unpublish' })
    ).toBeNull();
  });

  it('unpublishes after asking', async () => {
    events = [
      listItem({
        published: {
          __typename: 'EventRevision',
          id: 'rev-0',
          publishedAt: '2026-10-01T00:00:00.000Z',
        },
      }),
    ];

    renderList();

    fireEvent.click(
      screen.getByRole('button', { name: 'agenda.list.unpublish' })
    );
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'agenda.list.confirmUnpublish',
      })
    );

    await waitFor(() =>
      expect(unpublishEvent).toHaveBeenCalledWith({
        variables: { id: 'event-1' },
      })
    );
  });

  it('deletes after asking, then reloads the list', async () => {
    renderList();

    fireEvent.click(screen.getByRole('button', { name: 'delete' }));
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'agenda.list.confirmDelete',
      })
    );

    await waitFor(() =>
      expect(deleteEvent).toHaveBeenCalledWith({
        variables: { id: 'event-1' },
      })
    );
    await waitFor(() => expect(refetch).toHaveBeenCalled());
  });

  it('collapses into a simple stack for an organiser with a few events', () => {
    events = [listItem({ id: 'a' }), listItem({ id: 'b', name: 'INSÂN' })];

    renderList({ permissions: ORGANISER });

    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('keeps the table for someone who can publish', () => {
    renderList({ permissions: EDITOR });

    expect(screen.getByRole('table')).toBeTruthy();
  });

  it('tells an organiser without organisation why the list is empty', () => {
    events = [];
    memberships = 0;

    renderList({ permissions: [CanGetEvents.id] });

    expect(
      screen.getByText('agenda.list.empty.noMembershipTitle')
    ).toBeTruthy();
  });

  it('asks for the caller’s own organisations only to explain an empty list', () => {
    renderList();

    const memberships = mockedUseQuery.mock.calls.filter(
      ([document]) => document === TinyOrganizationListDocument
    );

    expect(memberships.map(([, options]) => options?.variables)).toContainEqual(
      { filter: { mine: true }, take: 1 }
    );
  });
});
