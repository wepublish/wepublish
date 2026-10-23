import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  CreatePlaceDocument,
  DeletePlaceDocument,
  EditorPlaceDocument,
  EditorPlaceFragment,
  EventRegionsDocument,
  TinyOrganizationListDocument,
  UpdatePlaceDocument,
} from '@wepublish/editor/api';
import {
  CanUpdateOrganization,
  CanUpdateOtherOrganizations,
} from '@wepublish/permissions';
import { Route, Routes, useLocation } from 'react-router-dom';
import type { Mock } from 'vitest';

import { renderWith } from '../event-list/test-helpers';
import { CreateVenue } from './create-venue';
import { EditVenue } from './edit-venue';
import { testPlace } from './test-helpers';

vi.mock('react-i18next', async () =>
  (await import('../event-list/test-translate')).i18nMock()
);

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useApolloClient: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as Mock;
const mockedUseMutation = useMutation as unknown as Mock;
const mockedUseApolloClient = useApolloClient as unknown as Mock;

const MEMBER = [CanUpdateOrganization.id];
const AGENDA_ADMIN = [CanUpdateOrganization.id, CanUpdateOtherOrganizations.id];

const EQUILIBRE = {
  __typename: 'SensitiveDataOrganization',
  id: 'org-1',
  name: 'Equilibre',
};

let place: EditorPlaceFragment;
const createPlace = vi.fn();
const updatePlace = vi.fn();
const deletePlace = vi.fn();
const query = vi.fn();

beforeEach(() => {
  place = testPlace();
  createPlace
    .mockReset()
    .mockResolvedValue({ data: { createPlace: { id: 'place-new' } } });
  updatePlace.mockReset().mockResolvedValue({ data: { updatePlace: place } });
  deletePlace.mockReset().mockResolvedValue({ data: {} });
  query.mockReset().mockImplementation(({ query: document }) =>
    Promise.resolve(
      document === EditorPlaceDocument ? { data: { place } }
      : document === TinyOrganizationListDocument ?
        { data: { organizations: { nodes: [EQUILIBRE], totalCount: 1 } } }
      : { data: {} }
    )
  );
  mockedUseApolloClient.mockReturnValue({ query });
  mockedUseQuery.mockReset().mockImplementation(document => {
    if (document === EditorPlaceDocument) {
      return { data: { place }, loading: false };
    }

    if (document === EventRegionsDocument) {
      return {
        data: {
          eventRegions: [
            { __typename: 'EventRegion', id: 'region-1', name: 'Stadt Bern' },
          ],
        },
      };
    }

    if (document === TinyOrganizationListDocument) {
      return {
        data: { organizations: { nodes: [EQUILIBRE], totalCount: 1 } },
      };
    }

    return { data: undefined, loading: false };
  });
  mockedUseMutation.mockImplementation(document => [
    document === CreatePlaceDocument ? createPlace
    : document === UpdatePlaceDocument ? updatePlace
    : document === DeletePlaceDocument ? deletePlace
    : vi.fn(),
    { loading: false },
  ]);
});

function LocationProbe() {
  const location = useLocation();

  return <output data-testid="location">{location.pathname}</output>;
}

const renderEdit = (permissions = MEMBER) =>
  render(
    renderWith(
      <>
        <Routes>
          <Route
            path="/venues/edit/:id"
            element={<EditVenue />}
          />
          <Route
            path="/venues"
            element={<p>venue list</p>}
          />
        </Routes>
        <LocationProbe />
      </>,
      { permissions, route: '/venues/edit/place-1' }
    )
  );

const renderCreate = (permissions = MEMBER, route = '/venues/create') =>
  render(
    renderWith(
      <>
        <Routes>
          <Route
            path="/venues/create"
            element={<CreateVenue />}
          />
        </Routes>
        <LocationProbe />
      </>,
      { permissions, route }
    )
  );

const nameField = () =>
  screen.findByRole('textbox', { name: 'agenda.venues.form.name' });

describe('EditVenue', () => {
  it('loads the venue into the form through async default values', async () => {
    renderEdit();

    expect(await nameField()).toHaveValue('Nuithonie');
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        query: EditorPlaceDocument,
        variables: { id: 'place-1' },
      })
    );
  });

  it('labels private by its effect', async () => {
    renderEdit();
    await nameField();

    expect(
      screen.getByRole('checkbox', { name: 'agenda.venues.form.private' })
    ).not.toBeChecked();
    expect(
      screen.getByText('agenda.venues.form.privateHelp')
    ).toBeInTheDocument();
  });

  it('groups the accessibility self-declaration and keeps ProInfirmis read-only', async () => {
    place = testPlace({
      proInfirmisIdSource: 'poi-42',
      proInfirmisDetailUrl: 'https://www.ginto.guide/entries/42',
      proInfirmisPictograms: ['Rollstuhlgerecht'],
    });
    renderEdit();
    await nameField();

    const group = screen.getByRole('group', {
      name: 'agenda.venues.form.accessibility',
    });

    expect(group).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', {
        name: 'agenda.venues.form.wheelchairAccessible',
      })
    ).toBeChecked();
    expect(
      screen.getByRole('link', { name: /agenda.venues.proInfirmis.open/ })
    ).toHaveAttribute('href', 'https://www.ginto.guide/entries/42');
  });

  it('saves the venue with its organisation and flags', async () => {
    renderEdit();

    fireEvent.change(await nameField(), {
      target: { value: 'Nuithonie Salle' },
    });
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'agenda.venues.form.private' })
    );
    fireEvent.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(updatePlace).toHaveBeenCalled());
    expect(updatePlace.mock.calls[0][0].variables).toEqual(
      expect.objectContaining({
        id: 'place-1',
        name: 'Nuithonie Salle',
        organizationId: 'org-1',
        private: true,
        wheelchairAccessible: true,
        wheelchairAccessibleToilets: true,
        wheelchairAccessibleParking: false,
      })
    );
  });

  it('says at the top of the form when fields need attention before saving', async () => {
    renderEdit();

    fireEvent.change(await nameField(), { target: { value: '' } });
    fireEvent.click(screen.getByTestId('saveButton'));

    expect(await screen.findByText('agenda.form.invalid')).toBeInTheDocument();
    expect(updatePlace).not.toHaveBeenCalled();
  });

  it("explains a refused delete with the API's reason about future dates", async () => {
    deletePlace.mockRejectedValue(
      new Error('Place place-1 still has 3 upcoming events.')
    );
    renderEdit();
    await nameField();

    fireEvent.click(
      screen.getByRole('button', { name: 'agenda.venues.delete.action' })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'agenda.venues.delete.confirm' })
    );

    expect(
      await screen.findByText('agenda.venues.delete.upcoming 3')
    ).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/venues/edit/place-1'
    );
  });

  it('goes back to the list after a delete', async () => {
    renderEdit();
    await nameField();

    fireEvent.click(
      screen.getByRole('button', { name: 'agenda.venues.delete.action' })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'agenda.venues.delete.confirm' })
    );

    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(/^\/venues$/)
    );
    expect(deletePlace).toHaveBeenCalledWith({ variables: { id: 'place-1' } });
  });

  it('explains a venue the caller may not change', async () => {
    place = testPlace({
      viewerCan: {
        __typename: 'PlaceViewerPermissions',
        update: false,
        delete: false,
      },
    });
    renderEdit([]);

    expect(await nameField()).toBeDisabled();
    expect(screen.getByText('agenda.venues.form.readOnly')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'agenda.venues.delete.action' })
    ).not.toBeInTheDocument();
  });
});

describe('CreateVenue', () => {
  it('preselects the organisation from the address and opens the new venue', async () => {
    renderCreate(MEMBER, '/venues/create?organizationId=org-1');

    fireEvent.change(await nameField(), { target: { value: 'Nuithonie' } });
    fireEvent.change(
      screen.getByRole('textbox', { name: 'agenda.venues.form.address' }),
      { target: { value: 'Rue du Centre 7' } }
    );
    fireEvent.change(
      screen.getByRole('textbox', { name: 'agenda.venues.form.zip' }),
      { target: { value: '1752' } }
    );
    fireEvent.change(
      screen.getByRole('textbox', { name: 'agenda.venues.form.city' }),
      { target: { value: 'Villars-sur-Glâne' } }
    );
    fireEvent.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/venues/edit/place-new'
      )
    );
    expect(createPlace.mock.calls[0][0].variables).toEqual(
      expect.objectContaining({
        name: 'Nuithonie',
        organizationId: 'org-1',
        private: false,
      })
    );
  });

  it('asks a member for one of their organisations', async () => {
    renderCreate();

    fireEvent.change(await nameField(), { target: { value: 'Nuithonie' } });
    fireEvent.click(screen.getByTestId('saveButton'));

    expect(
      await screen.findByText('agenda.venues.errors.organizationRequired')
    ).toBeInTheDocument();
    expect(createPlace).not.toHaveBeenCalled();
  });

  it('lets an agenda administrator file a venue without an organisation', async () => {
    renderCreate(AGENDA_ADMIN);

    fireEvent.change(await nameField(), { target: { value: 'Nuithonie' } });
    fireEvent.change(
      screen.getByRole('textbox', { name: 'agenda.venues.form.address' }),
      { target: { value: 'Rue du Centre 7' } }
    );
    fireEvent.change(
      screen.getByRole('textbox', { name: 'agenda.venues.form.zip' }),
      { target: { value: '1752' } }
    );
    fireEvent.change(
      screen.getByRole('textbox', { name: 'agenda.venues.form.city' }),
      { target: { value: 'Villars-sur-Glâne' } }
    );
    fireEvent.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(createPlace).toHaveBeenCalled());
    expect(createPlace.mock.calls[0][0].variables.organizationId).toBeNull();
  });
});
