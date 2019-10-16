import {query} from './query'

export async function authenticateWithCredentials(
  url: string,
  email: string,
  password: string
): Promise<any> {
  return query(url, {
    mutation: `
    mutation authenticateWithCredentials($email: String!, password: String!) {
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
  })
}
