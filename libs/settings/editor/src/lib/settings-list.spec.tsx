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
import {
  actWait,
  AuthContext,
  closeSnackbar,
  sessionWithPermissions,
} from '@wepublish/ui/editor';
import * as v2Client from '@wepublish/editor/api';
import { BrowserRouter } from 'react-router-dom';
import { SettingList } from './settings-list';
import { createTheme, ThemeProvider } from '@mui/material';

const theme = createTheme({ cssVariables: true });

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

  afterEach(() => {
    closeSnackbar();
  });

  test('renders successfully', async () => {
    const { baseElement, asFragment } = render(
      <ThemeProvider theme={theme}>
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
      </ThemeProvider>
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

  test('keeps the checkboxes of a card in one group', async () => {
    const { baseElement } = render(
      <ThemeProvider theme={theme}>
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
      </ThemeProvider>
    );

    await waitFor(() =>
      expect(
        screen.getByText('settingList.guestCommenting')
      ).toBeInTheDocument()
    );

    const group = (label: string) =>
      screen.getByText(label).closest('.MuiFormGroup-root');

    expect(group('settingList.guestCommenting')).toBeInTheDocument();
    expect(group('settingList.guestCommenting')).toBe(
      group('settingList.allowCommentEditing')
    );
    expect(baseElement.querySelectorAll('.MuiFormGroup-root').length).toBe(2);
  });

  test('offers the settings as checkboxes, not switches', async () => {
    const { baseElement } = render(
      <ThemeProvider theme={theme}>
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
      </ThemeProvider>
    );

    await waitFor(() =>
      expect(
        screen.getByText('settingList.guestCommenting')
      ).toBeInTheDocument()
    );

    expect(baseElement.querySelector('.MuiCheckbox-root')).toBeInTheDocument();
    expect(
      baseElement.querySelector('.MuiSwitch-root')
    ).not.toBeInTheDocument();
  });

  test('says what unit a number is in', async () => {
    render(
      <ThemeProvider theme={theme}>
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
      </ThemeProvider>
    );

    await waitFor(() =>
      expect(screen.getByText('settingList.ms')).toBeInTheDocument()
    );
    expect(screen.getAllByText('settingList.minutes')).toHaveLength(2);
    // session lifetime, the email-quality window, the evidence warning, the
    // subscription renewal window and the expiry of a pending payment method
    // change
    expect(screen.getAllByText('settingList.days')).toHaveLength(5);
  });

  test('spaces every card in the second column alike', async () => {
    render(
      <ThemeProvider theme={theme}>
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
      </ThemeProvider>
    );

    await waitFor(() =>
      expect(screen.getByText('settingList.peering')).toBeInTheDocument()
    );

    const gridItem = (heading: string) =>
      screen.getByText(heading).closest('.MuiGrid-root')?.parentElement;

    expect(gridItem('settingList.articlePage')).toBe(
      gridItem('settingList.peering')
    );
  });

  test('renders the setting list view with settings', async () => {
    render(
      <ThemeProvider theme={theme}>
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
      </ThemeProvider>
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
