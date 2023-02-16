/* eslint-disable @typescript-eslint/no-explicit-any */
import {getApiClientV2} from 'apps/editor/src/app/utility'
import {createContext} from 'react'

export const GraphqlClientContext = createContext({
  createSubscriptionInterval: (payload: any): Promise<any> => {
    throw new Error('Default context must be overriden!')
  },
  updateSubscriptionInterval: (payload: any): Promise<any> => {
    throw new Error('Default context must be overriden!')
  },
  deleteSubscriptionInterval: (payload: any): Promise<any> => {
    throw new Error('Default context must be overriden!')
  }
})
