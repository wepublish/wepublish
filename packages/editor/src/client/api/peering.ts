import gql from 'graphql-tag'
import {QueryHookOptions, useQuery, useMutation, MutationHookOptions} from '@apollo/react-hooks'

import {ImageRefData, ImageRefFragment} from './image'

export interface Peer {
  hostURL: string
  info: PeerInfo
}

export interface PeerInfo {
  name: string
  hostURL: string
  logo?: ImageRefData
  themeColor: string
}

// Query
// =====

export const PeerInfoQuery = gql`
  {
    peerInfo {
      name
      hostURL
      themeColor
      logo {
        ...ImageRefFragment
      }
    }
  }

  ${ImageRefFragment}
`

export interface PeerInfoData {
  peerInfo: PeerInfo
}

export function usePeerInfoQuery(opts?: QueryHookOptions<PeerInfoData>) {
  return useQuery<PeerInfoData>(PeerInfoQuery, opts)
}

const PeerListQuery = gql`
  {
    peers {
      hostURL
      info {
        name
        hostURL
        themeColor
        logo {
          ...ImageRefFragment
        }
      }
    }
  }

  ${ImageRefFragment}
`

export interface PeerListData {
  peers: Peer[]
}

export function usePeerListQuery(opts?: QueryHookOptions<PeerListData>) {
  return useQuery<PeerListData>(PeerListQuery, opts)
}

// Mutation
// ========

export interface PeerInfoInput {
  name: string
  logoID?: string
  themeColor: string
}

const UpdatePeerInfoMutation = gql`
  mutation UpdatePeerInfo($input: PeerInfoInput!) {
    updatePeerInfo(input: $input) {
      name
      hostURL
      themeColor
      logo {
        ...ImageRefFragment
      }
    }
  }

  ${ImageRefFragment}
`

export interface UpdatePeerInfoData {
  updateSettings: PeerInfo
}

export interface UpdatePeerInfoVariables {
  input: PeerInfoInput
}

export function useUpdatePeerInfoMutation(
  opts?: MutationHookOptions<UpdatePeerInfoData, UpdatePeerInfoVariables>
) {
  return useMutation<UpdatePeerInfoData, UpdatePeerInfoVariables>(UpdatePeerInfoMutation, opts)
}
