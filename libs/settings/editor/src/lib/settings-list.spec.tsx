import {render, screen, waitFor} from '@testing-library/react'
import {MockedProvider as MockedProviderBase} from '@apollo/client/testing'
import '@testing-library/jest-dom'
import {SettingList} from './settings-list'
import {BrowserRouter} from 'react-router-dom'
import {
  SettingName,
  SettingsListDocument,
  SettingsListQuery,
  UpdateSettingListDocument
} from '@wepublish/editor/api-v2'
import {actWait, sessionWithPermissions} from '@wepublish/ui/editor'
import {AuthContext} from '@wepublish/ui/editor'

import fetch from 'jest-fetch-mock'

jest.setMock('node-fetch', fetch)

jest.mock('@wepublish/website/api-v2', () => ({
  getApiClientV2: jest.fn()
}))

const MockedProvider = MockedProviderBase as any

const settingsMockData = {
  settingsList: [
    {
      __typename: 'Setting',
      id: '1',
      name: SettingName.AllowGuestCommenting,
      value: false,
      enabled: true
    },
    {
      __typename: 'Setting',
      id: '2',
      name: SettingName.AllowGuestPollVoting,
      value: false,
      enabled: true
    },
    {
      __typename: 'Setting',
      id: '3',
      name: SettingName.PeeringTimeoutMs,
      value: 100,
      enabled: true
    }
  ]
}

const toggleSettingMockData = {
  toggleSetting: true
}

const mocks = [
  {
    request: {
      query: SettingsListDocument,
      variables: {}
    },
    result: () => {
      return {
        data: settingsMockData as SettingsListQuery
      }
    }
  },
  {
    request: {
      query: UpdateSettingListDocument,
      variables: {
        id: '1'
      }
    },
    result: () => {
      return {
        data: toggleSettingMockData
      }
    }
  }
]

describe('SettingList', () => {
  test('renders successfully', () => {
    const {baseElement, asFragment} = render(
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProvider mocks={mocks} addTypename={false}>
          <BrowserRouter>
            <SettingList />
          </BrowserRouter>
        </MockedProvider>
      </AuthContext.Provider>
    )
    expect(baseElement).toBeTruthy()
    expect(asFragment()).toMatchSnapshot()
  })

  test('renders the setting list view with settings', async () => {
    render(
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProvider mocks={mocks} addTypename={false}>
          <BrowserRouter>
            <SettingList />
          </BrowserRouter>
        </MockedProvider>
      </AuthContext.Provider>
    )

    await actWait()

    await waitFor(() => {
      expect(screen.getByText('settingList.guestCommenting')).toBeInTheDocument()
      expect(screen.getByText('settingList.allowGuestCommentRating')).toBeInTheDocument()
    })
  })
})
