import { MockedProvider as MockedProviderBase } from '@apollo/client/testing';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import {
  SettingName,
  SettingsListDocument,
  SettingsListQuery,
  UpdateSettingDocument,
} from '@wepublish/editor/api';
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

const mocks = [
  {
    request: {
      query: SettingsListDocument,
      variables: {},
    },
    result: () => {
      return {
        data: settingsMockData,
      };
    },
  },
  {
    request: {
      query: UpdateSettingDocument,
      variables: {
        id: '1',
      },
    },
    result: () => {
      return {
        data: toggleSettingMockData,
      };
    },
  },
];

describe('SettingList', () => {
  beforeAll(() => {
    jest.spyOn(v2Client, 'getApiClientV2').mockReturnValue(undefined as any);
  });

  test('renders successfully', async () => {
    const { baseElement, asFragment } = render(
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProvider
          mocks={mocks}
          addTypename={false}
        >
          <BrowserRouter>
            <SettingList />
          </BrowserRouter>
        </MockedProvider>
      </AuthContext.Provider>
    );

    await actWait();

    expect(baseElement).toBeTruthy();
    expect(asFragment()).toMatchSnapshot();
  });

  test('renders the setting list view with settings', async () => {
    render(
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProvider
          mocks={mocks}
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
