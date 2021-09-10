import fetch from 'cross-fetch'
import gql from 'graphql-tag'
import {print} from 'graphql'

const CreateIncomingPeerRequestMutation = gql`
  mutation CreateIncomingPeerRequest($input: PeerRequestInput!) {
    createIncomingPeerRequest(input: $input) {
      token
    }
  }
`

export async function createOutgoingPeerRequestToken(
  url: string,
  hostURL: string
): Promise<string | undefined> {
  const response = await fetch(`${url}/admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      query: print(CreateIncomingPeerRequestMutation),
      variables: {
        input: {
          hostURL: hostURL
        }
      }
    })
  }).then(r => r.json())

  return response?.data?.createIncomingPeerRequest?.token
}
