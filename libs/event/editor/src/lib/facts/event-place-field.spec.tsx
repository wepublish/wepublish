import { useQuery } from '@apollo/client/react';
import { fireEvent, screen } from '@testing-library/react';
import { TinyPlaceListDocument } from '@wepublish/editor/api';
import { CanUpdateOrganization } from '@wepublish/permissions';
import type { Mock } from 'vitest';

import { formValues, renderInForm } from '../test-helpers';
import { EventPlaceField } from './event-place-field';

vi.mock('react-i18next', async () =>
  (await import('../event-list/test-translate')).i18nMock()
);

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as Mock;

const PLACES = [
  {
    __typename: 'Place',
    id: 'place-1',
    name: 'Nuithonie',
    zip: '1752',
    city: 'Villars-sur-Glâne',
  },
];

const withPlaces = (nodes: typeof PLACES) =>
  mockedUseQuery.mockImplementation(() => ({
    data: { places: { nodes, totalCount: nodes.length } },
    loading: false,
  }));

beforeEach(() => {
  mockedUseQuery.mockReset();
});

describe('EventPlaceField', () => {
  it('offers only the venues the caller may file events at', () => {
    withPlaces(PLACES);
    renderInForm(<EventPlaceField />);

    expect(mockedUseQuery).toHaveBeenCalledWith(
      TinyPlaceListDocument,
      expect.objectContaining({
        variables: expect.objectContaining({ filter: { selectable: true } }),
      })
    );
  });

  it('shows the postcode and city beside each venue and stores the pick', () => {
    withPlaces(PLACES);
    renderInForm(<EventPlaceField />);

    fireEvent.mouseDown(
      screen.getByRole('combobox', { name: 'agenda.form.place' })
    );

    expect(screen.getByText('1752 Villars-sur-Glâne')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('option', { name: /Nuithonie/ }));

    expect(formValues().place).toMatchObject({ id: 'place-1' });
  });

  it('explains that events need a venue when none can be picked', () => {
    withPlaces([]);
    renderInForm(<EventPlaceField />);

    expect(screen.getByText('agenda.form.placeNone')).toBeInTheDocument();
  });

  it('links to creating a venue, in a new tab, when none can be picked and the caller may create one', () => {
    withPlaces([]);
    renderInForm(<EventPlaceField />, {
      permissions: [CanUpdateOrganization.id],
    });

    const link = screen.getByRole('link', {
      name: /agenda.form.placeCreate/,
    });

    expect(link).toHaveAttribute('href', '/venues/create');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('offers no create link to a caller who may not create venues', () => {
    withPlaces([]);
    renderInForm(<EventPlaceField />);

    expect(
      screen.queryByRole('link', { name: /agenda.form.placeCreate/ })
    ).not.toBeInTheDocument();
  });
});
