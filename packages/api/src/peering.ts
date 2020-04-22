import fetch from 'cross-fetch'
import gql from 'graphql-tag'
import {DBAdapter} from './db/adapter'

const CreateIncomingPeerRequestMutation = gql`
  mutation CreateIncomingPeerRequest($input: PeerRequestInput!) {
    createIncomingPeerRequest(input: $input) {
      token
    }
  }
`

export async function createOutgoingPeerRequestToken(
  url: string,
  dbAdapter: DBAdapter
): Promise<string> {
  const settings = await dbAdapter.getSettings()
  const response = await fetch(`${url}/admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      query: CreateIncomingPeerRequestMutation.loc!.source.body,
      variables: {
        input: {
          apiURL: settings.apiURL
        }
      }
    })
  }).then(r => r.json())

  return response.data.createIncomingPeerRequest.token
}
