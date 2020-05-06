import gql from 'graphql-tag'
import {QueryHookOptions, useQuery, useMutation, MutationHookOptions} from '@apollo/react-hooks'

import {ImageRefData, ImageRefFragment} from './image'

export enum PeerState {
  Accepted = 'accepted',
  Declined = 'declined',
  Pending = 'pending',
  Requested = 'requested'
}

export interface Peer {
  id: string
  name: string
  hostURL: string
  info?: PeerInfo
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
      id
      name
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

export interface PeerRequestInput {
  hostURL: string
}

const CreateOutgoingPeerRequestMutation = gql`
  mutation CreateOutgoingPeerRequest($input: PeerRequestInput!) {
    createOutgoingPeerRequest(input: $input) {
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

export interface CreateOutgoingPeerRequestInfoData {
  updateSettings: PeerInfo
}

export interface CreateOutgoingPeerRequestVariables {
  input: PeerRequestInput
}

export function useCreateOutgoingPeerRequestMutation(
  opts?: MutationHookOptions<CreateOutgoingPeerRequestInfoData, CreateOutgoingPeerRequestVariables>
) {
  return useMutation(CreateOutgoingPeerRequestMutation, opts)
}
