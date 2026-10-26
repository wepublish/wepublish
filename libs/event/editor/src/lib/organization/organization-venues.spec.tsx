import { useQuery } from '@apollo/client/react';
import { render, screen } from '@testing-library/react';
import { EditorPlaceListDocument } from '@wepublish/editor/api';
import { CanUpdateOrganization } from '@wepublish/permissions';
import type { Mock } from 'vitest';

import { renderWith } from '../event-list/test-helpers';
import { testPlaceListItem } from '../venue/test-helpers';
import { OrganizationVenues } from './organization-venues';

vi.mock('react-i18next', async () =>
  (await import('../event-list/test-translate')).i18nMock()
);

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as Mock;

const withPlaces = (nodes: ReturnType<typeof testPlaceListItem>[]) =>
  mockedUseQuery.mockReset().mockReturnValue({
    data: { places: { nodes, totalCount: nodes.length } },
    loading: false,
  });

const renderVenues = (permissions = [CanUpdateOrganization.id]) =>
  render(
    renderWith(<OrganizationVenues organizationId="org-1" />, { permissions })
  );

describe('OrganizationVenues', () => {
  it("lists the organisation's venues with links to edit them", () => {
    withPlaces([testPlaceListItem()]);
    renderVenues();

    expect(mockedUseQuery).toHaveBeenCalledWith(
      EditorPlaceListDocument,
      expect.objectContaining({
        variables: expect.objectContaining({
          filter: { organizationId: 'org-1' },
        }),
      })
    );
    expect(screen.getByRole('link', { name: 'Nuithonie' })).toHaveAttribute(
      'href',
      '/venues/edit/place-1'
    );
  });

  it('explains that events need a venue and links to creating one', () => {
    withPlaces([]);
    renderVenues();

    expect(
      screen.getByText('agenda.organizations.venues.none')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: 'agenda.organizations.venues.create',
      })
    ).toHaveAttribute('href', '/venues/create?organizationId=org-1');
  });

  it('offers no create link to a caller who may not create venues', () => {
    withPlaces([]);
    renderVenues([]);

    expect(
      screen.queryByRole('link', {
        name: 'agenda.organizations.venues.create',
      })
    ).not.toBeInTheDocument();
  });
});
