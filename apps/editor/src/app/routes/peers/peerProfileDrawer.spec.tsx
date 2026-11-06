import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor, within } from '@testing-library/react';
import {
  type FullPeerProfileFragment,
  type PeerListQuery,
  type UpdatePeerProfileMutation,
  type UpdatePeerProfileMutationVariables,
  PeerListDocument,
  PeerProfileDocument,
  UpdatePeerProfileDocument,
} from '@wepublish/editor/api';
import {
  drawerClosed,
  formSectionOf,
  getFieldByLabel,
  imageFixture,
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
import type { RichtextJSONDocument } from '@wepublish/richtext';
import { type AuthContextState, AuthContext } from '@wepublish/ui/editor';
import type { ReactNode } from 'react';

import { PeerList } from './peerList';

const callToAction: RichtextJSONDocument = {
  type: 'doc',
  attrs: undefined,
  content: [
    {
      type: 'paragraph',
      attrs: { textAlign: null },
      content: [{ type: 'text', attrs: undefined, text: 'Jetzt abonnieren' }],
    },
  ],
};

const sentCallToAction = JSON.parse(JSON.stringify(callToAction));

const ownProfile: FullPeerProfileFragment = {
  __typename: 'PeerProfile',
  name: 'We.Publish Demo',
  themeColor: '#123456',
  themeFontColor: '#ffffff',
  hostURL: 'https://api.demo.example/',
  websiteURL: 'https://demo.example',
  callToActionText: callToAction,
  callToActionURL: 'https://demo.example/abo',
  callToActionImageURL: 'https://demo.example/banner',
  logo: imageFixture('logo', 'Logo'),
  squareLogo: imageFixture('square-logo', 'Quadratisches Logo'),
  callToActionImage: imageFixture('cta', 'Banner'),
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

const profileRequests = vi.fn();
const updated =
  vi.fn<(variables: UpdatePeerProfileMutationVariables) => void>();

const listMock: MockLink.MockedResponse = {
  request: { query: PeerListDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: () => {
    const data: PeerListQuery = { __typename: 'Query', peers: [] };

    return { data };
  },
};

const ownProfileMock: MockLink.MockedResponse = {
  request: { query: PeerProfileDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: () => {
    profileRequests();

    return { data: { peerProfile: ownProfile } };
  },
};

const updateMock: MockLink.MockedResponse = {
  request: { query: UpdatePeerProfileDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: UpdatePeerProfileMutationVariables) => {
    updated(JSON.parse(JSON.stringify(variables)));

    const data: UpdatePeerProfileMutation = {
      __typename: 'Mutation',
      updatePeerProfile: { ...ownProfile, name: variables.name },
    };

    return { data };
  },
};

const withSession =
  (session: AuthContextState) =>
  ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider value={session}>{children}</AuthContext.Provider>
  );

const renderProfile = ({
  session = editor,
}: { session?: AuthContextState } = {}) =>
  renderFormRoutes(
    {
      '/peering': <PeerList />,
      '/peering/profile/edit': <PeerList />,
    },
    {
      route: '/peering/profile/edit',
      mocks: [listMock, ownProfileMock, updateMock],
      wrapper: withSession(session),
    }
  );

const drawer = () =>
  within(
    document.querySelector<HTMLElement>('.MuiDrawer-paper') as HTMLElement
  );

const nameInput = () => getFieldByLabel('peerList.panels.name*');
const themeColorInput = () => getFieldByLabel(/^peerList\.panels\.themeColor/);
const callToActionUrlInput = () =>
  getFieldByLabel('peerList.panels.callToActionURL*');
const save = () => screen.getByTestId('saveButton');

const loaded = () =>
  waitFor(() => expect(nameInput()).toHaveValue('We.Publish Demo'));

beforeEach(() => {
  profileRequests.mockClear();
  updated.mockClear();
});

describe('PeerProfileDrawer', () => {
  it('loads the own peer profile into titled sections', async () => {
    renderProfile();

    expect(
      drawer().getByRole('heading', {
        level: 2,
        name: 'peerList.panels.editPeerInfo',
      })
    ).toBeInTheDocument();
    await loaded();
    expect(themeColorInput()).toHaveValue('#123456');
    expect(getFieldByLabel('peerList.panels.themeFontColor*')).toHaveValue(
      '#ffffff'
    );
    expect(
      formSectionOf('peerList.panels.information').getByRole('group', {
        name: 'peerList.panels.logo*',
      })
    ).toBeInTheDocument();
    expect(
      formSectionOf('peerList.panels.information').getByRole('group', {
        name: 'peerList.panels.squareLogo*',
      })
    ).toBeInTheDocument();
    expect(
      formSectionOf('peerList.panels.callToActionText').getByText(
        'Jetzt abonnieren'
      )
    ).toBeInTheDocument();
    expect(callToActionUrlInput()).toHaveValue('https://demo.example/abo');
    expect(
      formSectionOf('peerList.panels.callToActionImage').getByText(
        'peerList.panels.ctaImageInfo'
      )
    ).toBeInTheDocument();
    expect(
      getFieldByLabel('peerList.panels.callToActionImageURL*')
    ).toHaveValue('https://demo.example/banner');
    expect(save()).toBeDisabled();
    expect(screen.getByTestId('discardButton')).toBeDisabled();
    expect(screen.queryByTestId('saveAndCloseButton')).not.toBeInTheDocument();
  });

  it('requires a name', async () => {
    const { user } = renderProfile();

    await loaded();
    await user.clear(nameInput());
    await user.click(save());

    await waitFor(() =>
      expect(nameInput()).toHaveAttribute('aria-invalid', 'true')
    );
    expect(drawer().getByText('form.errors.required')).toBeInTheDocument();
    expect(updated).not.toHaveBeenCalled();
  });

  it('rejects a call to action URL that is not one', async () => {
    const { user } = renderProfile();

    await loaded();
    await user.clear(callToActionUrlInput());
    await user.type(callToActionUrlInput(), 'demo');
    await user.click(save());

    expect(
      await drawer().findByText('form.errors.invalid_format.url')
    ).toBeInTheDocument();
    expect(updated).not.toHaveBeenCalled();
  });

  it('rejects a theme colour the API does not accept', async () => {
    const { user } = renderProfile();

    await loaded();
    await user.clear(themeColorInput());
    await user.type(themeColorInput(), '#12345678');
    await user.click(save());

    expect(await drawer().findByText('form.color.invalid')).toBeInTheDocument();
    expect(updated).not.toHaveBeenCalled();
  });

  it('requires a logo', async () => {
    const { user } = renderProfile();

    await loaded();
    await user.click(
      within(
        formSectionOf('peerList.panels.information').getByRole('group', {
          name: 'peerList.panels.logo*',
        })
      ).getByRole('button', { name: 'chooseEditImage.removeImage' })
    );
    await user.click(save());

    expect(
      await drawer().findByText('form.errors.required')
    ).toBeInTheDocument();
    expect(updated).not.toHaveBeenCalled();
  });

  it('saves with exact variables, refetches the profile and stays open', async () => {
    const { user, currentPath } = renderProfile();

    await loaded();
    const requestsBeforeSave = profileRequests.mock.calls.length;

    await user.type(nameInput(), ' Basel');
    await user.click(save());

    await waitFor(() => expect(updated).toHaveBeenCalledTimes(1));
    expect(updated.mock.calls[0][0]).toStrictEqual({
      name: 'We.Publish Demo Basel',
      logoID: 'logo',
      squareLogoId: 'square-logo',
      themeColor: '#123456',
      themeFontColor: '#ffffff',
      callToActionText: sentCallToAction,
      callToActionURL: 'https://demo.example/abo',
      callToActionImageID: 'cta',
      callToActionImageURL: 'https://demo.example/banner',
    });
    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
    await waitFor(() =>
      expect(profileRequests.mock.calls.length).toBeGreaterThan(
        requestsBeforeSave
      )
    );
    expect(currentPath()).toBe('/peering/profile/edit');
    expect(nameInput()).toHaveValue('We.Publish Demo Basel');
    await waitFor(() => expect(save()).toBeDisabled());
  });

  it('is read-only without CanUpdatePeerProfile', async () => {
    renderProfile({
      session: sessionWith([CanGetPeers, CanGetPeer, CanGetPeerProfile]),
    });

    await loaded();

    expect(drawer().getByText('form.view.readOnly')).toBeInTheDocument();
    expect(nameInput()).toBeDisabled();
    expect(callToActionUrlInput()).toBeDisabled();
    expect(screen.queryByTestId('saveButton')).not.toBeInTheDocument();
  });

  it('closes a clean drawer on Escape', async () => {
    const { user, currentPath } = renderProfile();

    await loaded();
    await user.keyboard('{Escape}');

    await drawerClosed();
    expect(currentPath()).toBe('/peering');
  });
});
