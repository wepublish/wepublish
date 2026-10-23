import { useMutation, useQuery } from '@apollo/client/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  DeletePlaceDocument,
  EditorPlaceListDocument,
  PlaceSort,
  SortOrder,
} from '@wepublish/editor/api';
import {
  CanGetEvents,
  CanGetOtherOrganizations,
  CanUpdateOrganization,
} from '@wepublish/permissions';
import type { Mock } from 'vitest';

import { renderWith } from '../event-list/test-helpers';
import { testPlaceListItem } from './test-helpers';
import { VenueList } from './venue-list';

vi.mock('react-i18next', async () =>
  (await import('../event-list/test-translate')).i18nMock()
);

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as Mock;
const mockedUseMutation = useMutation as unknown as Mock;

const ORGANISER = [CanGetEvents.id, CanUpdateOrganization.id];
const CROSS_ORG = [CanGetEvents.id, CanGetOtherOrganizations.id];

let places = [testPlaceListItem()];
const deletePlace = vi.fn();
const refetch = vi.fn();

beforeEach(() => {
  localStorage.clear();
  places = [testPlaceListItem()];
  deletePlace.mockReset().mockResolvedValue({ data: {} });
  refetch.mockReset();
  mockedUseQuery.mockReset().mockImplementation(() => ({
    data: { places: { nodes: places, totalCount: places.length } },
    loading: false,
    refetch,
  }));
  mockedUseMutation.mockImplementation(document => [
    document === DeletePlaceDocument ? deletePlace : vi.fn(),
    { loading: false },
  ]);
});

const renderList = (permissions = ORGANISER) =>
  render(renderWith(<VenueList />, { permissions, route: '/venues' }));

const openFilters = () =>
  fireEvent.click(
    screen.getByRole('button', { name: 'filterableList.filter.label' })
  );

const lastVariables = () =>
  mockedUseQuery.mock.calls
    .filter(([document]) => document === EditorPlaceListDocument)
    .at(-1)?.[1]?.variables;

const mineToggle = () =>
  screen.getByRole('switch', { name: 'agenda.venues.filter.mine' });

describe('VenueList', () => {
  it("shows an organiser their own organisations' venues by default", () => {
    renderList();
    openFilters();

    expect(lastVariables()).toEqual({
      filter: { mine: true },
      take: 10,
      skip: 0,
      sort: PlaceSort.Name,
      order: SortOrder.Ascending,
    });
    expect(mineToggle()).toBeChecked();

    fireEvent.click(mineToggle());

    expect(lastVariables().filter).toEqual({ mine: false });
  });

  it('shows a cross-organisation holder every venue, with the same toggle', () => {
    renderList(CROSS_ORG);
    openFilters();

    expect(lastVariables().filter).toEqual({});
    expect(mineToggle()).not.toBeChecked();

    fireEvent.click(mineToggle());

    expect(lastVariables().filter).toEqual({ mine: true });
  });

  it('links each venue and marks private and inactive ones in words', () => {
    places = [testPlaceListItem({ private: true, enabled: false })];
    renderList();

    expect(screen.getByRole('link', { name: 'Nuithonie' })).toHaveAttribute(
      'href',
      '/venues/edit/place-1'
    );
    expect(screen.getByText('agenda.venues.markers.private')).toBeVisible();
    expect(screen.getByText('agenda.venues.list.inactive')).toBeVisible();
    expect(screen.getByText('Equilibre')).toBeInTheDocument();
  });

  it('deletes after confirmation where viewerCan allows, and shows a refusal', async () => {
    deletePlace.mockRejectedValue(
      new Error('Place place-1 still has 2 upcoming events.')
    );
    places = [
      testPlaceListItem(),
      testPlaceListItem({
        id: 'place-2',
        name: 'Dampfzentrale',
        viewerCan: {
          __typename: 'PlaceViewerPermissions',
          update: false,
          delete: false,
        },
      }),
    ];
    renderList();

    const deletes = screen.getAllByRole('button', { name: 'delete' });

    expect(deletes).toHaveLength(1);

    fireEvent.click(deletes[0]);
    fireEvent.click(
      screen.getByRole('button', { name: 'agenda.venues.delete.confirm' })
    );

    expect(
      await screen.findByText('agenda.venues.delete.upcoming 2')
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(deletePlace).toHaveBeenCalledWith({ variables: { id: 'place-1' } })
    );
  });

  it('offers New venue only to callers who may create one', () => {
    renderList(CROSS_ORG);

    expect(
      screen.queryByRole('link', { name: 'agenda.venues.list.create' })
    ).not.toBeInTheDocument();
  });
});
