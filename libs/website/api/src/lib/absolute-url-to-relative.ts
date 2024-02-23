import {InMemoryCacheConfig} from '@apollo/client'

const absoluteToRelative = (url: string) => {
  try {
    const urlObj = new URL(url)

    return urlObj.pathname
  } catch {
    // url already is relative
    return url
  }
}

export const absoluteUrlToRelative: InMemoryCacheConfig['typePolicies'] = {
  Page: {
    fields: {
      url: {
        merge: (_, url: string) => absoluteToRelative(url)
      }
    }
  },
  Article: {
    fields: {
      url: {
        merge: (_, url: string, options) => {
          if (options.variables?.peerId) {
            return url
          }

          return absoluteToRelative(url)
        }
      }
    }
  },
  Event: {
    fields: {
      url: {
        merge: (_, url: string) => absoluteToRelative(url)
      }
    }
  }
}
