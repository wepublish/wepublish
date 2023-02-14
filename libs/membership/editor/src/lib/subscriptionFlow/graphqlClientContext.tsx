import {getApiClientV2} from 'apps/editor/src/app/utility'
import {createContext} from 'react'

export const GraphqlClientContext = createContext(getApiClientV2())
