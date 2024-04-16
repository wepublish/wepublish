import {MockedProvider as MockedProviderBase} from '@apollo/client/testing'
import {fireEvent, render} from '@testing-library/react'
import {
  InvoicesDocument,
  MemberPlanListDocument,
  PaymentMethodListDocument,
  RenewSubscriptionDocument,
  UserListDocument
} from '@wepublish/editor/api'
import {AuthContext} from '@wepublish/ui/editor'
import {BrowserRouter, useParams} from 'react-router-dom'
import snapshotDiff from 'snapshot-diff'

import {SubscriptionEditView} from '../../src/app/routes/subscriptions/subscriptionEditView'
import {actWait, sessionWithPermissions} from '../utils'

const MockedProvider = MockedProviderBase as any

const userListQuery = {
  request: {
    query: UserListDocument
  },
  result: () => {
    return require('./subscription-mocks/userlist.mock.json')
  }
}

const invoicesQuery = {
  request: {
    query: InvoicesDocument
  },
  result: () => {
    return require('./subscription-mocks/invoices.mock.json')
  }
}

const memberPlanListQuery = {
  request: {
    query: MemberPlanListDocument
  },
  result: () => {
    return require('./subscription-mocks/memberplanlist.mock.json')
  }
}

const paymentMethodListQuery = {
  request: {
    query: PaymentMethodListDocument
  },
  result: () => {
    return require('./subscription-mocks/paymentmethodlist.mock.json')
  }
}

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn()
}))

describe('Subscription edit view', () => {
  const mocks = [userListQuery, invoicesQuery, memberPlanListQuery, paymentMethodListQuery]

  beforeEach(() =>
    (useParams as jest.Mock).mockImplementation(() => ({id: 'clwgsc4470004ale8p14b99rv'}))
  )

  test('should render', async () => {
    const {asFragment} = render(
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProvider mocks={mocks} addTypename={false}>
          <BrowserRouter>
            <SubscriptionEditView />
          </BrowserRouter>
        </MockedProvider>
      </AuthContext.Provider>
    )
    await actWait()

    expect(asFragment()).toMatchSnapshot()
  })

  test('should allow a subscription to be extended', async () => {
    const mutationMock = {
      request: {
        query: RenewSubscriptionDocument,
        variables: {
          input: {
            id: 'clwgsc4470004ale8p14b99rv'
          }
        }
      },
      result: () => {
        return require('./subscription-mocks/renewsubscription.mock.json')
      }
    }

    const {asFragment, getByText} = render(
      <AuthContext.Provider value={sessionWithPermissions}>
        <MockedProvider mocks={[...mocks, mutationMock]} addTypename={false}>
          <BrowserRouter>
            <SubscriptionEditView />
          </BrowserRouter>
        </MockedProvider>
      </AuthContext.Provider>
    )
    await actWait()
    const initialRender = asFragment()

    const extendButton = getByText(/userSubscriptionEdit\.renewNow/)

    fireEvent.click(extendButton)

    expect(snapshotDiff(initialRender, asFragment())).toMatchSnapshot()
  })
})
