import {query} from './query'
import {Article} from '../shared'

export async function queryArticles(url: string): Promise<any> {
  return query(url, {
    query: `
    query getArticles {
      articles {
        pageInfo {
          publishedBetween {
            start
            end
          }
          updatedBetween {
            start
            end
          }
          createdBetween {
            start
            end
          }
        }
        nodes {
          id
          createdAt
          updatedAt
          publishedAt

          published {
            title
            lead
            version
            createdAt
            updatedAt
          }
          draft {
            title
            lead
            version
            createdAt
            updatedAt
          }
          versions {
            version
            title
          }
        }
      }
    }
  `
  })
}
