import { MockedProvider as MockedProviderBase } from '@apollo/client/testing/react';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import {
  PaywallListDocument,
  SettingName,
  SettingsListDocument,
  SettingsListQuery,
  UpdateSettingDocument,
} from '@wepublish/editor/api';
import { toaster } from 'rsuite';
import {
  AuthContext,
  actWait,
  sessionWithPermissions,
} from '@wepublish/ui/editor';
import * as v2Client from '@wepublish/editor/api';
import { BrowserRouter } from 'react-router-dom';
import { SettingList } from './settings-list';

const MockedProvider = MockedProviderBase as any;

const settingsMockData = {
  settings: [
    {
      __typename: 'Setting',
      id: '1',
      name: SettingName.AllowGuestCommenting,
      value: false,
      settingRestriction: null,
    },
    {
      __typename: 'Setting',
      id: '2',
      name: SettingName.AllowGuestPollVoting,
      value: false,
      settingRestriction: null,
    },
    {
      __typename: 'Setting',
      id: '3',
      name: SettingName.PeeringTimeoutMs,
      value: 100,
      settingRestriction: null,
    },
  ],
} as SettingsListQuery;

const toggleSettingMockData = {
  toggleSetting: true,
};

const settingsListMock = {
  request: {
    query: SettingsListDocument,
  },
  result: () => ({
    data: settingsMockData,
  }),
};

const updateSettingMock = {
  request: {
    query: UpdateSettingDocument,
    variables: {
      id: '1',
    },
  },
  result: () => ({
    data: toggleSettingMockData,
  }),
};

const paywallListMock = {
  request: {
    query: PaywallListDocument,
  },
  result: () => ({
    data: { paywalls: [] },
  }),
};

describe('SettingList', () => {
  beforeAll(() => {
    vi.spyOn(v2Client, 'getApiClientV2').mockReturnValue(undefined as any);
  });

  // toasts arm dismiss timers that outlive the test environment on slow
  // runners ("window is not defined" after teardown) — clear them per test
  afterEach(() => {
    toaster.clear();
  });

  test('renders successfully', async () => {
    const { baseElement, asFragment } = render(
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProvider
          mocks={[settingsListMock, updateSettingMock, paywallListMock]}
          addTypename={false}
        >
          <BrowserRouter>
            <SettingList />
          </BrowserRouter>
        </MockedProvider>
      </AuthContext.Provider>
    );

    // Apollo Client 4 delivers the first result a tick later than v3, so wait
    // for rendered content instead of a fixed tick — otherwise the snapshot
    // captures an empty fragment.
    await waitFor(() =>
      expect(
        screen.getByText('settingList.guestCommenting')
      ).toBeInTheDocument()
    );

    // Rendering the list is not the last state change: one effect copies the
    // loaded settings into the reducer, a second then diffs them and empties
    // `changedSetting`, which disables save and reset. Snapshot before those
    // flush and the buttons are still enabled — that is the frame a fast
    // machine caught, and why this snapshot disagreed with CI.
    await waitFor(() => {
      const save = baseElement.querySelector('button[type="submit"]');

      expect(save).toBeTruthy();
      expect(save).toBeDisabled();
    });

    expect(baseElement).toBeTruthy();
    expect(asFragment()).toMatchSnapshot();
  });

  test('renders the setting list view with settings', async () => {
    render(
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProvider
          mocks={[settingsListMock, updateSettingMock, paywallListMock]}
          addTypename={false}
        >
          <BrowserRouter>
            <SettingList />
          </BrowserRouter>
        </MockedProvider>
      </AuthContext.Provider>
    );

    await actWait();

    await waitFor(() => {
      expect(
        screen.getByText('settingList.guestCommenting')
      ).toBeInTheDocument();
      expect(
        screen.getByText('settingList.allowGuestCommentRating')
      ).toBeInTheDocument();
    });
  });
});
