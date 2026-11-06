import type { MockLink } from '@apollo/client/testing';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import {
  type CreatePeerMutation,
  type CreatePeerMutationVariables,
  type FullPeerFragment,
  type FullPeerImageFragment,
  type FullPeerProfileFragment,
  type FullRemotePeerProfileFragment,
  type PeerListQuery,
  type RemotePeerProfileQueryVariables,
  type UpdatePeerMutation,
  type UpdatePeerMutationVariables,
  CreatePeerDocument,
  PeerDocument,
  PeerListDocument,
  PeerProfileDocument,
  RemotePeerProfileDocument,
  UpdatePeerDocument,
} from '@wepublish/editor/api';
import {
  drawerClosed,
  formSectionOf,
  getFieldByLabel,
  queryFieldByLabel,
  renderFormRoutes,
} from '@wepublish/form/editor/testing';
import {
  type Permission,
  CanCreatePeer,
  CanDeletePeer,
  CanGetPeer,
  CanGetPeerProfile,
  CanGetPeers,
  CanUpdatePeerProfile,
} from '@wepublish/permissions';
import { type AuthContextState, AuthContext } from '@wepublish/ui/editor';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { PeerList } from './peerList';

const timestamp = '2024-01-01T00:00:00.000Z';

const peerImage = (id: string): FullPeerImageFragment => ({
  __typename: 'PeerImage',
  id,
  createdAt: timestamp,
  modifiedAt: timestamp,
  filename: id,
  format: 'png',
  mimeType: 'image/png',
  extension: '.png',
  width: 400,
  height: 400,
  fileSize: 1024,
  title: null,
  description: null,
  tags: [],
  source: null,
  link: null,
  license: null,
  focalPointX: 0.5,
  focalPointY: 0.5,
  url: `https://media.example.com/${id}.png`,
  xxl: null,
  xl: `https://media.example.com/${id}-xl.png`,
  l: null,
  m: null,
  s: null,
  xs: null,
  xxs: null,
  xxlSquare: null,
  xlSquare: null,
  lSquare: null,
  mSquare: null,
  sSquare: null,
  xsSquare: `https://media.example.com/${id}-xs.png`,
  xxsSquare: null,
});

const remoteProfile = (
  name: string,
  overrides: Partial<FullRemotePeerProfileFragment> = {}
): FullRemotePeerProfileFragment => ({
  __typename: 'RemotePeerProfile',
  name,
  themeColor: '#0a0a0a',
  themeFontColor: '#fafafa',
  hostURL: 'https://api.bajour.example/',
  websiteURL: 'https://bajour.example',
  callToActionText: null,
  callToActionURL: 'https://bajour.example/abo',
  callToActionImageURL: null,
  logo: peerImage('bajour-logo'),
  squareLogo: null,
  callToActionImage: null,
  ...overrides,
});

const bajour: FullPeerFragment = {
  __typename: 'Peer',
  id: 'peer-1',
  createdAt: timestamp,
  modifiedAt: timestamp,
  name: 'Bajour',
  slug: 'bajour',
  isDisabled: false,
  information: null,
  hostURL: 'https://api.bajour.example/',
  token: 'stored-token',
  profile: remoteProfile('Bajour Profil'),
};

const ownProfile: FullPeerProfileFragment = {
  __typename: 'PeerProfile',
  name: 'We.Publish Demo',
  themeColor: '#000000',
  themeFontColor: '#ffffff',
  hostURL: 'https://api.demo.example/',
  websiteURL: 'https://demo.example',
  callToActionText: null,
  callToActionURL: 'https://demo.example',
  callToActionImageURL: null,
  logo: null,
  squareLogo: null,
  callToActionImage: null,
};

const permission = (granted: Permission) => ({
  __typename: 'Permission' as const,
  ...granted,
});

const sessionWith = (permissions: Permission[]): AuthContextState => ({
  session: {
    email: 'editor@example.com',
    sessionToken: 'session-token',
    sessionRoles: [
      {
        __typename: 'UserRole',
        id: 'peer-editor',
        name: 'peer-editor',
        description: null,
        systemRole: false,
        permissions: permissions.map(permission),
      },
    ],
  },
});

const editor = sessionWith([
  CanGetPeers,
  CanGetPeer,
  CanCreatePeer,
  CanDeletePeer,
  CanGetPeerProfile,
  CanUpdatePeerProfile,
]);

const created = vi.fn<(variables: CreatePeerMutationVariables) => void>();
const updated = vi.fn<(variables: UpdatePeerMutationVariables) => void>();
const fetchedRemote =
  vi.fn<(variables: RemotePeerProfileQueryVariables) => void>();

const listMock: MockLink.MockedResponse = {
  request: { query: PeerListDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: () => {
    const data: PeerListQuery = { __typename: 'Query', peers: [bajour] };

    return { data };
  },
};

const ownProfileMock: MockLink.MockedResponse = {
  request: { query: PeerProfileDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: { data: { peerProfile: ownProfile } },
};

const peerMock = (peer: FullPeerFragment | null, id = 'peer-1') =>
  ({
    request: { query: PeerDocument, variables: { id } },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: { data: { peer } },
  }) as MockLink.MockedResponse;

const createdPeer: FullPeerFragment = {
  ...bajour,
  id: 'peer-new',
  name: 'Hauptstadt Bern',
  slug: 'hauptstadt-bern',
  hostURL: 'https://api.hauptstadt.example/',
  token: 'new-token',
  profile: null,
};

const createMock: MockLink.MockedResponse = {
  request: { query: CreatePeerDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: CreatePeerMutationVariables) => {
    created(JSON.parse(JSON.stringify(variables)));

    const data: CreatePeerMutation = {
      __typename: 'Mutation',
      createPeer: createdPeer,
    };

    return { data };
  },
};

const updateMock: MockLink.MockedResponse = {
  request: { query: UpdatePeerDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: UpdatePeerMutationVariables) => {
    updated(JSON.parse(JSON.stringify(variables)));

    const data: UpdatePeerMutation = {
      __typename: 'Mutation',
      updatePeer: { ...bajour, name: variables.name ?? bajour.name },
    };

    return { data };
  },
};

const remoteMock: MockLink.MockedResponse = {
  request: { query: RemotePeerProfileDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: RemotePeerProfileQueryVariables) => {
    fetchedRemote(JSON.parse(JSON.stringify(variables)));

    return {
      data: { remotePeerProfile: remoteProfile('Bajour Neu') },
    };
  },
};

const defaultMocks = () => [
  listMock,
  ownProfileMock,
  peerMock(bajour),
  peerMock(createdPeer, 'peer-new'),
  createMock,
  updateMock,
  remoteMock,
];

function BrowserBack() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      data-testid="browserBack"
      onClick={() => navigate(-1)}
    />
  );
}

const withSession =
  (session: AuthContextState) =>
  ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider value={session}>
      {children}
      <BrowserBack />
    </AuthContext.Provider>
  );

const renderPeers = (
  route: string,
  {
    mocks = defaultMocks(),
    session = editor,
  }: { mocks?: MockLink.MockedResponse[]; session?: AuthContextState } = {}
) =>
  renderFormRoutes(
    {
      '/peering': <PeerList />,
      '/peering/create': <PeerList />,
      '/peering/edit/:id': <PeerList />,
      '/peering/profile/edit': <PeerList />,
    },
    { route, mocks, wrapper: withSession(session) }
  );

const drawer = () =>
  within(
    document.querySelector<HTMLElement>('.MuiDrawer-paper') as HTMLElement
  );

const drawerHeading = (name: string) =>
  drawer().getByRole('heading', { level: 2, name });

const nameInput = () => getFieldByLabel(/^peerList\.panels\.name/);
const urlInput = () => getFieldByLabel(/^peerList\.overview\.hostURL/);
const tokenInput = () => getFieldByLabel(/^peerList\.panels\.token/);

const remoteProfileSection = () =>
  formSectionOf('peerList.panels.remoteProfile');

const fetchButton = () =>
  remoteProfileSection().getByRole('button', {
    name: 'peerList.panels.getRemote',
  });

const discardPrompt = () =>
  screen.queryByRole('dialog', { name: 'form.view.discardChanges.title' });

const loaded = (name = 'Bajour') =>
  waitFor(() =>
    expect(queryFieldByLabel(/^peerList\.panels\.name/)).toHaveValue(name)
  );

beforeEach(() => {
  created.mockClear();
  updated.mockClear();
  fetchedRemote.mockClear();
});

describe('PeerDrawer', () => {
  it('opens the create drawer with empty fields in titled sections', () => {
    renderPeers('/peering/create');

    expect(drawerHeading('peerList.panels.createPeer')).toBeInTheDocument();
    expect(getFieldByLabel('peerList.panels.name*')).toHaveValue('');
    expect(
      formSectionOf('peerList.panels.connection').getByLabelText(
        /^peerList\.overview\.hostURL\*/,
        { selector: 'input' }
      )
    ).toHaveValue('');
    expect(tokenInput()).toHaveValue('');
    expect(tokenInput()).toHaveAttribute('type', 'password');
    expect(tokenInput()).toBeRequired();
    expect(fetchButton()).toBeDisabled();
    expect(screen.getByTestId('saveButton')).toBeInTheDocument();
    expect(screen.getByTestId('saveAndCloseButton')).toBeInTheDocument();
  });

  it('requires a name, a URL and a token on create', async () => {
    const { user } = renderPeers('/peering/create');

    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(nameInput()).toHaveAttribute('aria-invalid', 'true')
    );
    expect(urlInput()).toHaveAttribute('aria-invalid', 'true');
    expect(tokenInput()).toHaveAttribute('aria-invalid', 'true');
    expect(drawer().getAllByText('form.errors.required')).toHaveLength(3);
    expect(created).not.toHaveBeenCalled();
  });

  it('rejects a URL that is not one', async () => {
    const { user } = renderPeers('/peering/create');

    await user.type(urlInput(), 'api.hauptstadt');
    await user.tab();

    expect(
      await drawer().findByText('form.errors.invalid_format.url')
    ).toBeInTheDocument();
  });

  it('creates with a slug from the name and a normalised URL, then opens the new peer', async () => {
    const { user, currentPath } = renderPeers('/peering/create');

    await user.type(nameInput(), 'Hauptstadt Bern');
    await user.type(urlInput(), 'https://api.hauptstadt.example');
    await user.type(tokenInput(), 'new-token');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(created).toHaveBeenCalledTimes(1));
    expect(created.mock.calls[0][0]).toStrictEqual({
      name: 'Hauptstadt Bern',
      slug: 'hauptstadt-bern',
      hostURL: 'https://api.hauptstadt.example/',
      token: 'new-token',
      information: null,
    });
    expect(await screen.findByText('toast.createdSuccess')).toBeInTheDocument();
    await waitFor(() => expect(currentPath()).toBe('/peering/edit/peer-new'));
    await loaded('Hauptstadt Bern');
    expect(drawerHeading('peerList.panels.editPeer')).toBeInTheDocument();
  });

  it('closes after save and close on create', async () => {
    const { user, currentPath } = renderPeers('/peering/create');

    await user.type(nameInput(), 'Hauptstadt Bern');
    await user.type(urlInput(), 'https://api.hauptstadt.example/');
    await user.type(tokenInput(), 'new-token');
    await user.click(screen.getByTestId('saveAndCloseButton'));

    await waitFor(() => expect(created).toHaveBeenCalledTimes(1));
    await drawerClosed();
    expect(currentPath()).toBe('/peering');
    expect(discardPrompt()).not.toBeInTheDocument();
  });

  it('fetches the remote profile with the typed URL and token on create', async () => {
    const { user } = renderPeers('/peering/create');

    await user.type(urlInput(), 'https://api.bajour.example/');
    await user.type(tokenInput(), 'typed-token');
    await user.click(fetchButton());

    expect(
      await remoteProfileSection().findByText('Bajour Neu')
    ).toBeInTheDocument();
    expect(fetchedRemote).toHaveBeenCalledWith({
      hostURL: 'https://api.bajour.example/',
      token: 'typed-token',
    });
  });

  it('loads the stored peer and its profile, but never shows the stored token', async () => {
    renderPeers('/peering/edit/peer-1');

    await loaded();
    expect(drawerHeading('peerList.panels.editPeer')).toBeInTheDocument();
    expect(urlInput()).toHaveValue('https://api.bajour.example/');
    expect(getFieldByLabel(/^peerList\.panels\.token$/)).toHaveValue('');
    expect(tokenInput()).not.toBeRequired();
    expect(tokenInput()).toHaveAccessibleDescription(
      'peerList.panels.leaveEmpty'
    );
    expect(screen.queryByDisplayValue('stored-token')).not.toBeInTheDocument();
    expect(
      remoteProfileSection().getByText('Bajour Profil')
    ).toBeInTheDocument();
  });

  it('drops the profile when the URL is edited', async () => {
    const { user } = renderPeers('/peering/edit/peer-1');

    await loaded();
    await user.type(urlInput(), 'x');

    expect(
      remoteProfileSection().queryByText('Bajour Profil')
    ).not.toBeInTheDocument();
  });

  it('drops the profile when the token is edited', async () => {
    const { user } = renderPeers('/peering/edit/peer-1');

    await loaded();
    await user.type(tokenInput(), 'x');

    expect(
      remoteProfileSection().queryByText('Bajour Profil')
    ).not.toBeInTheDocument();
  });

  it('fetches the remote profile with the stored token while the token field is empty', async () => {
    const { user } = renderPeers('/peering/edit/peer-1');

    await loaded();
    await user.click(fetchButton());

    expect(
      await remoteProfileSection().findByText('Bajour Neu')
    ).toBeInTheDocument();
    expect(fetchedRemote).toHaveBeenCalledWith({
      hostURL: 'https://api.bajour.example/',
      token: 'stored-token',
    });
  });

  it('updates with a new slug and without a token, and stays open after save', async () => {
    const { user, currentPath } = renderPeers('/peering/edit/peer-1');

    await loaded();
    await user.type(nameInput(), ' Basel');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(updated).toHaveBeenCalledTimes(1));
    expect(updated.mock.calls[0][0]).toStrictEqual({
      id: 'peer-1',
      name: 'Bajour Basel',
      slug: 'bajour-basel',
      hostURL: 'https://api.bajour.example/',
      information: null,
    });
    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
    expect(currentPath()).toBe('/peering/edit/peer-1');
  });

  it('keeps the stored slug while the name is unchanged and sends a new token', async () => {
    const { user, currentPath } = renderPeers('/peering/edit/peer-1');

    await loaded();
    await user.type(tokenInput(), 'rotated-token');
    await user.click(screen.getByTestId('saveAndCloseButton'));

    await waitFor(() => expect(updated).toHaveBeenCalledTimes(1));
    expect(updated.mock.calls[0][0]).toStrictEqual({
      id: 'peer-1',
      name: 'Bajour',
      slug: 'bajour',
      hostURL: 'https://api.bajour.example/',
      token: 'rotated-token',
      information: null,
    });
    await drawerClosed();
    expect(currentPath()).toBe('/peering');
  });

  it('is read-only without CanCreatePeer', async () => {
    renderPeers('/peering/edit/peer-1', {
      session: sessionWith([CanGetPeers, CanGetPeer, CanGetPeerProfile]),
    });

    await loaded();

    expect(drawer().getByText('form.view.readOnly')).toBeInTheDocument();
    expect(nameInput()).toBeDisabled();
    expect(urlInput()).toBeDisabled();
    expect(tokenInput()).toBeDisabled();
    expect(fetchButton()).toBeDisabled();
    expect(screen.queryByTestId('saveButton')).not.toBeInTheDocument();
    expect(screen.queryByTestId('saveAndCloseButton')).not.toBeInTheDocument();
  });

  it('shows a load error for a peer that does not exist', async () => {
    renderPeers('/peering/edit/peer-gone', {
      mocks: [listMock, ownProfileMock, peerMock(null, 'peer-gone')],
    });

    expect(await screen.findByText('form.loadError.title')).toBeInTheDocument();
    expect(
      queryFieldByLabel(/^peerList\.panels\.name/)
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('saveButton')).toBeDisabled();
  });

  it('closes a clean drawer on Escape without asking', async () => {
    const { user, currentPath } = renderPeers('/peering/edit/peer-1');

    await loaded();
    await user.keyboard('{Escape}');

    await drawerClosed();
    expect(currentPath()).toBe('/peering');
    expect(discardPrompt()).not.toBeInTheDocument();
  });

  it('asks before the close button discards changes', async () => {
    const { user, currentPath } = renderPeers('/peering/edit/peer-1');

    await loaded();
    await user.type(nameInput(), ' Basel');
    await user.click(screen.getByRole('button', { name: 'close' }));

    expect(discardPrompt()).toBeInTheDocument();
    expect(currentPath()).toBe('/peering/edit/peer-1');

    await user.click(
      screen.getByRole('button', { name: 'form.view.discardChanges.discard' })
    );

    await drawerClosed();
    expect(currentPath()).toBe('/peering');
    expect(updated).not.toHaveBeenCalled();
  });

  it('opens from the edit action and closes on browser Back', async () => {
    const { user, currentPath } = renderPeers('/peering');

    await screen.findByText('We.Publish Demo');
    await user.click(
      await screen.findByRole('link', { name: 'peerList.panels.editPeer' })
    );
    await loaded();
    fireEvent.click(screen.getByTestId('browserBack'));

    await waitFor(() => expect(currentPath()).toBe('/peering'));
    await drawerClosed();
  });
});
