import {GraphQLSchema} from 'graphql'

import {GraphQLQuery, GraphQLMutation} from './graphql'
import {Adapter} from './adapter'

export * from './graphql'
export * from './adapter'
export * from './context'

export interface HandlerOptions {
  adapter: Adapter
  tokenSecret: string
  refreshTokenExpiresIn?: number
  accessTokenExpiresIn?: number
  peerFetchTimeout: number
}

export const WepublishGraphQLSchema = new GraphQLSchema({
  query: GraphQLQuery,
  mutation: GraphQLMutation
})

// export function createAPIHandler({
//   adapter,
//   tokenSecret,
//   refreshTokenExpiresIn = 60 * 60 * 24 * 7, // 1 Week
//   accessTokenExpiresIn = 60 * 60 // 1 Hour
// }: HandlerOptions): RequestListener {
//   const graphQLHandler = createGraphQLHTTPHandler(async req => ({
//     schema: WepublishGraphQLSchema,
//     graphiql: true,
//     context: await contextFromRequest(req, {
//       adapter,
//       tokenSecret,
//       refreshTokenExpiresIn,
//       accessTokenExpiresIn
//     })
//   }))

//   return (req, res) => {
//     res.setHeader(
//       'Access-Control-Allow-Headers',
//       'Authorization, Content-Type, Content-Length, Accept, Origin, User-Agent'
//     )

//     res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
//     res.setHeader('Access-Control-Allow-Origin', '*')

//     if (req.method === 'OPTIONS') {
//       res.statusCode = 200
//       return res.end()
//     }

//     if (
//       req.method === 'POST' &&
//       req.headers['content-type'] &&
//       req.headers['content-type'].startsWith('multipart/form-data')
//     ) {
//       processRequest(req, res)
//         .then(body => {
//           ;(req as any).body = body
//           graphQLHandler(req, res)
//         })
//         .catch(err => {
//           console.error(err)

//           res.statusCode = 500
//           res.end()
//         })
//     } else {
//       graphQLHandler(req, res)
//     }
//   }
// }

// export function createAPIHandler({
//   adapter,
//   tokenSecret,
//   refreshTokenExpiresIn = 60 * 60 * 24 * 7, // 1 Week
//   accessTokenExpiresIn = 60 * 60 // 1 Hour
// }: HandlerOptions): RequestListener {
//   const graphQLHandler = createGraphQLHTTPHandler(async req => ({
//     schema: graphQLSchema,
//     graphiql: true,
//     context: await contextFromRequest(req, {
//       adapter,
//       tokenSecret,
//       refreshTokenExpiresIn,
//       accessTokenExpiresIn
//     })
//   }))

//   return (req, res) => {
//     res.setHeader(
//       'Access-Control-Allow-Headers',
//       'Authorization, Content-Type, Content-Length, Accept, Origin, User-Agent'
//     )

//     res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
//     res.setHeader('Access-Control-Allow-Origin', '*')

//     if (req.method === 'OPTIONS') {
//       res.statusCode = 200
//       return res.end()
//     }

//     if (
//       req.method === 'POST' &&
//       req.headers['content-type'] &&
//       req.headers['content-type'].startsWith('multipart/form-data')
//     ) {
//       processRequest(req, res)
//         .then(body => {
//           ;(req as any).body = body
//           graphQLHandler(req, res)
//         })
//         .catch(err => {
//           console.error(err)

//           res.statusCode = 500
//           res.end()
//         })
//     } else {
//       graphQLHandler(req, res)
//     }
//   }
// }
