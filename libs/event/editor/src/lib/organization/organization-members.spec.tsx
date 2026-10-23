import { useMutation, useQuery } from '@apollo/client/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  AddOrganizationMemberDocument,
  EditorOrganizationMembersDocument,
  RemoveOrganizationMemberDocument,
  UserListDocument,
} from '@wepublish/editor/api';
import type { Mock } from 'vitest';

import { renderWith } from '../event-list/test-helpers';
import { OrganizationMembers } from './organization-members';

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

const member = (id: string, firstName: string, name: string) => ({
  __typename: 'OrganizationMember',
  userId: id,
  createdAt: '2026-05-01T10:00:00.000Z',
  user: { __typename: 'User', id, firstName, name },
});

let members = [member('user-1', 'Lea', 'Muster')];
let manageMembers = true;
const addMember = vi.fn();
const removeMember = vi.fn();
const refetch = vi.fn();

beforeEach(() => {
  members = [member('user-1', 'Lea', 'Muster')];
  manageMembers = true;
  addMember.mockReset().mockResolvedValue({ data: {} });
  removeMember.mockReset().mockResolvedValue({ data: {} });
  refetch.mockReset().mockResolvedValue({});
  mockedUseQuery.mockReset().mockImplementation(document => {
    if (document === EditorOrganizationMembersDocument) {
      return {
        data: {
          organization: {
            __typename: 'SensitiveDataOrganization',
            id: 'org-1',
            members,
            viewerCan: {
              __typename: 'OrganizationViewerPermissions',
              manageMembers,
            },
          },
        },
        loading: false,
        refetch,
      };
    }

    if (document === UserListDocument) {
      return {
        data: {
          users: {
            nodes: [
              {
                __typename: 'User',
                id: 'user-2',
                firstName: 'Max',
                name: 'Beispiel',
                email: 'max@example.com',
              },
            ],
          },
        },
        loading: false,
      };
    }

    return { data: undefined };
  });
  mockedUseMutation.mockImplementation(document => [
    document === AddOrganizationMemberDocument ? addMember
    : document === RemoveOrganizationMemberDocument ? removeMember
    : vi.fn(),
    { loading: false },
  ]);
});

const renderMembers = () =>
  render(renderWith(<OrganizationMembers organizationId="org-1" />));

describe('OrganizationMembers', () => {
  it('lists the members by name', () => {
    renderMembers();

    expect(screen.getByText('Lea Muster')).toBeInTheDocument();
  });

  it('removes a member through the mutation', async () => {
    renderMembers();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'agenda.organizations.members.remove Lea Muster',
      })
    );

    await waitFor(() =>
      expect(removeMember).toHaveBeenCalledWith({
        variables: { organizationId: 'org-1', userId: 'user-1' },
      })
    );
    expect(refetch).toHaveBeenCalled();
  });

  it('adds the picked user through the mutation', async () => {
    renderMembers();

    const search = screen.getByRole('combobox', {
      name: 'agenda.organizations.members.add',
    });
    fireEvent.mouseDown(search);
    fireEvent.click(
      await screen.findByRole('option', { name: /Max Beispiel/ })
    );

    await waitFor(() =>
      expect(addMember).toHaveBeenCalledWith({
        variables: { organizationId: 'org-1', userId: 'user-2' },
      })
    );
  });

  it('offers neither adding nor removing without the right to manage members', () => {
    manageMembers = false;
    renderMembers();

    expect(screen.getByText('Lea Muster')).toBeInTheDocument();
    expect(
      screen.queryByRole('combobox', {
        name: 'agenda.organizations.members.add',
      })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: /agenda.organizations.members.remove/,
      })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('agenda.organizations.members.manageLocked')
    ).toBeInTheDocument();
  });

  it('explains that notifications reach nobody when there are no members', () => {
    members = [];
    renderMembers();

    expect(
      screen.getByText('agenda.organizations.members.noneTitle')
    ).toBeInTheDocument();
    expect(
      screen.getByText('agenda.organizations.members.noneBody')
    ).toBeInTheDocument();
  });
});
