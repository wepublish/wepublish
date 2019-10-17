import {query, RequestOptions} from './query'

export async function authenticateWithCredentials(
  url: string,
  email: string,
  password: string,
  opts?: RequestOptions
): Promise<{
  user: {email: string}
  refreshToken: string
  accessToken: string
  refreshTokenExpiresIn: number
  accessTokenExpiresIn: number
}> {
  const {authenticateWithCredentials: response} = await query(
    url,
    {
      query: `
    mutation authenticateWithCredentials($email: String!, $password: String!) {
      authenticateWithCredentials(email: $email, password: $password) {
        user {email},
        refreshToken,
        accessToken,
        refreshTokenExpiresIn,
        accessTokenExpiresIn
      }
    }
  `,
      variables: {
        email,
        password
      }
    },
    opts
  )
  return response
}
