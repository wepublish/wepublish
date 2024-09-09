import {GraphQLClient} from 'graphql-request'

const publicGraphqlEndpoint = process.env['WEPUBLISH_API_URL'] + '/v1'
export const publicClient = new GraphQLClient(publicGraphqlEndpoint, {
  headers: {
    'Content-Type': 'application/json'
  }
})

export const privateToken = process.env['TOKEN']
export const privateGraphqlEndpoint = publicGraphqlEndpoint + '/admin'
export const privateClient = new GraphQLClient(privateGraphqlEndpoint, {
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${privateToken}`
  }
})
