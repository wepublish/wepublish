import {Context} from '@nuxt/types'
import {InMemoryCache, IntrospectionFragmentMatcher} from 'apollo-cache-inmemory'

export default (context: Context) => {
  return {
    httpEndpoint: process.server
      ? context.$config.WEP_API_URL_SSR
      : context.$config.WEP_API_URL_CLIENT,
    // https://github.com/nuxt-community/apollo-module/issues/120
    cache: new InMemoryCache({
      fragmentMatcher: new IntrospectionFragmentMatcher({
        introspectionQueryResultData: {
          __schema: {
            types: []
          }
        }
      })
    })
  }
}
