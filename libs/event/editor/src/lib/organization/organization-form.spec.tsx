import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import {
  CreateOrganizationDocument,
  EditorOrganizationDocument,
  EditorOrganizationFragment,
  EventAffiliationsDocument,
  EventRegionsDocument,
  TagListDocument,
  TagType,
  UpdateOrganizationDocument,
} from '@wepublish/editor/api';
import {
  CanCreateOrganization,
  CanUpdateOrganization,
  CanUpdateOtherOrganizations,
} from '@wepublish/permissions';
import { Route, Routes, useLocation } from 'react-router-dom';
import type { Mock } from 'vitest';

import { renderWith } from '../event-list/test-helpers';
import { CreateOrganization } from './create-organization';
import { EditOrganization } from './edit-organization';
import { testOrganization } from './test-helpers';

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

const MEMBER = [CanCreateOrganization.id, CanUpdateOrganization.id];
const AGENDA_ADMIN = [...MEMBER, CanUpdateOtherOrganizations.id];

const TAGS = ['Theater', 'Tanz', 'Musik', 'Kunst'].map((tag, index) => ({
  __typename: 'Tag',
  id: `tag-${index + 1}`,
  tag,
  type: TagType.Event,
}));

let organization: EditorOrganizationFragment;
const createOrganization = vi.fn();
const updateOrganization = vi.fn();
const query = vi.fn();

beforeEach(() => {
  organization = testOrganization();
  createOrganization
    .mockReset()
    .mockResolvedValue({ data: { createOrganization: { id: 'org-new' } } });
  updateOrganization
    .mockReset()
    .mockResolvedValue({ data: { updateOrganization: organization } });
  query
    .mockReset()
    .mockImplementation(({ query: document }) =>
      Promise.resolve(
        document === EditorOrganizationDocument ?
          { data: { organization } }
        : { data: {} }
      )
    );
  mockedUseApolloClient.mockReturnValue({ query });
  mockedUseQuery.mockReset().mockImplementation(document => {
    if (document === EditorOrganizationDocument) {
      return { data: { organization }, loading: false };
    }

    if (document === EventRegionsDocument) {
      return {
        data: {
          eventRegions: [
            { __typename: 'EventRegion', id: 'region-1', name: 'Stadt Bern' },
            { __typename: 'EventRegion', id: 'region-2', name: 'Biel' },
          ],
        },
      };
    }

    if (document === EventAffiliationsDocument) {
      return {
        data: {
          eventAffiliations: [
            { __typename: 'EventAffiliation', id: 'aff-1', name: 'Kulturlegi' },
            { __typename: 'EventAffiliation', id: 'aff-2', name: 'AHV/IV' },
          ],
        },
      };
    }

    if (document === TagListDocument) {
      return {
        data: { tags: { nodes: TAGS, totalCount: TAGS.length } },
        refetch: vi.fn(),
      };
    }

    return { data: undefined, loading: false };
  });
  mockedUseMutation.mockImplementation(document => [
    document === CreateOrganizationDocument ? createOrganization
    : document === UpdateOrganizationDocument ? updateOrganization
    : vi.fn().mockResolvedValue({ data: {} }),
    { loading: false },
  ]);
});

function LocationProbe() {
  const location = useLocation();

  return <output data-testid="location">{location.pathname}</output>;
}

const renderEdit = (permissions = AGENDA_ADMIN) =>
  render(
    renderWith(
      <>
        <Routes>
          <Route
            path="/organizations/edit/:id"
            element={<EditOrganization />}
          />
        </Routes>
        <LocationProbe />
      </>,
      { permissions, route: '/organizations/edit/org-1' }
    )
  );

const renderCreate = (permissions = MEMBER) =>
  render(
    renderWith(
      <>
        <Routes>
          <Route
            path="/organizations/create"
            element={<CreateOrganization />}
          />
        </Routes>
        <LocationProbe />
      </>,
      { permissions, route: '/organizations/create' }
    )
  );

const nameField = () =>
  screen.findByRole('textbox', { name: 'agenda.organizations.form.name' });

const partnerSwitch = () =>
  screen.getByRole('switch', { name: 'agenda.organizations.form.partner' });

const enabledSwitch = () =>
  screen.getByRole('switch', { name: 'agenda.organizations.form.enabled' });

describe('EditOrganization', () => {
  it('loads the organisation into the form through async default values', async () => {
    renderEdit();

    expect(await nameField()).toHaveValue('Equilibre');
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        query: EditorOrganizationDocument,
        variables: { id: 'org-1' },
      })
    );
    expect(
      screen.getByRole('textbox', {
        name: 'agenda.organizations.form.postOfficeBox',
      })
    ).toHaveValue('Postfach 12');
  });

  it('labels partner by its effect and lets only privileged callers change it', async () => {
    organization = testOrganization({
      viewerCan: {
        __typename: 'OrganizationViewerPermissions',
        update: true,
        updatePrivileged: false,
        delete: true,
        manageMembers: false,
      },
    });
    renderEdit(MEMBER);
    await nameField();

    expect(partnerSwitch()).toBeDisabled();
    expect(enabledSwitch()).toBeDisabled();
    expect(
      screen.getAllByText('agenda.organizations.form.privilegedLocked')
    ).toHaveLength(2);
  });

  it('lets a holder of the cross-organisation update permission change partner', async () => {
    renderEdit();
    await nameField();

    expect(partnerSwitch()).toBeEnabled();
    expect(enabledSwitch()).toBeEnabled();
    expect(
      screen.getByText('agenda.organizations.form.partnerHelp')
    ).toBeInTheDocument();
  });

  it('offers the ten legal forms and none', async () => {
    renderEdit();
    await nameField();

    fireEvent.mouseDown(
      screen.getByRole('combobox', {
        name: 'agenda.organizations.form.legalStatus',
      })
    );

    const options = within(screen.getByRole('listbox')).getAllByRole('option');

    expect(options).toHaveLength(11);
    expect(options[0]).toHaveTextContent(
      'agenda.organizations.form.legalStatusNone'
    );
    expect(options[1]).toHaveTextContent(
      'agenda.organizations.legalStatus.association'
    );
  });

  it('caps the tags at three and says so', async () => {
    organization = testOrganization({
      tags: TAGS.slice(0, 3).map(({ id, tag }) => ({
        __typename: 'Tag' as const,
        id,
        tag,
      })),
    });
    renderEdit();
    await nameField();

    expect(
      screen.getByText('agenda.organizations.form.tagsAtMax 3')
    ).toBeInTheDocument();
  });

  it('saves the whole form, resending unchanged partner and enabled', async () => {
    organization = testOrganization({
      viewerCan: {
        __typename: 'OrganizationViewerPermissions',
        update: true,
        updatePrivileged: false,
        delete: false,
        manageMembers: false,
      },
    });
    renderEdit(MEMBER);

    fireEvent.change(await nameField(), {
      target: { value: 'Théâtre Equilibre' },
    });
    fireEvent.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(updateOrganization).toHaveBeenCalled());
    expect(updateOrganization.mock.calls[0][0].variables).toEqual(
      expect.objectContaining({
        id: 'org-1',
        name: 'Théâtre Equilibre',
        partner: true,
        enabled: true,
        tagIds: ['tag-1'],
        affiliationIds: ['aff-1'],
        contacts: [
          { label: 'Kasse', email: 'kasse@equilibre.ch', phone: null },
        ],
      })
    );
  });

  it('explains a read-only organisation instead of offering Save', async () => {
    organization = testOrganization({
      viewerCan: {
        __typename: 'OrganizationViewerPermissions',
        update: false,
        updatePrivileged: false,
        delete: false,
        manageMembers: false,
      },
    });
    renderEdit([]);

    expect(await nameField()).toBeDisabled();
    expect(
      screen.getByText('agenda.organizations.form.readOnly')
    ).toBeInTheDocument();
    expect(screen.getByTestId('saveButton')).toBeDisabled();
  });
});

describe('CreateOrganization', () => {
  it('creates the organisation and opens it', async () => {
    renderCreate();

    fireEvent.change(await nameField(), { target: { value: 'Equilibre' } });
    fireEvent.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/organizations/edit/org-new'
      )
    );
    expect(createOrganization.mock.calls[0][0].variables).toEqual(
      expect.objectContaining({
        name: 'Equilibre',
        enabled: true,
        partner: false,
      })
    );
  });

  it('keeps partner and enabled locked for a creator without the cross-organisation permission', async () => {
    renderCreate();
    await nameField();

    expect(partnerSwitch()).toBeDisabled();
  });

  it('lets an agenda administrator set partner on create', async () => {
    renderCreate(AGENDA_ADMIN);
    await nameField();

    expect(partnerSwitch()).toBeEnabled();
  });
});
