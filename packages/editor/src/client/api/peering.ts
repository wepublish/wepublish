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
  slug: string
  hostURL: string
  profile?: PeerProfile
}

export interface PeerProfile {
  name: string
  hostURL: string
  logo?: ImageRefData
  themeColor: string
}

// Query
// =====

export const PeerProfileQueryName = 'PeerProfile'

export const PeerProfileQuery = gql`
  query ${PeerProfileQueryName} {
    peerProfile {
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

export interface PeerProfileData {
  peerProfile: PeerProfile
}

export function usePeerProfileQuery(opts?: QueryHookOptions<PeerProfileData>) {
  return useQuery(PeerProfileQuery, opts)
}

export const PeerListQueryName = 'PeerList'

export const PeerListQuery = gql`
  query ${PeerListQueryName} {
    peers {
      id
      name
      hostURL
      profile {
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
  return useQuery(PeerListQuery, opts)
}

export const PeerQueryName = 'Peer'

export const PeerQuery = gql`
  query ${PeerQueryName}($id: ID!) {
    peer(id: $id) {
      id
      name
      slug
      hostURL
    }
  }

`

export interface PeerData {
  peer: Peer
}

export interface PeerVariables {
  id: string
}

export function usePeerQuery(opts?: QueryHookOptions<PeerData, PeerVariables>) {
  return useQuery(PeerQuery, opts)
}

// Mutation
// ========

export interface PeerProfileInput {
  name: string
  logoID?: string
  themeColor: string
}

export const UpdatePeerProfileMutation = gql`
  mutation UpdatePeerProfile($input: PeerProfileInput!) {
    updatePeerProfile(input: $input) {
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

export interface UpdatePeerProfileData {
  updateSettings: PeerProfile
}

export interface UpdatePeerProfileVariables {
  input: PeerProfileInput
}

export function useUpdatePeerProfileMutation(
  opts?: MutationHookOptions<UpdatePeerProfileData, UpdatePeerProfileVariables>
) {
  return useMutation<UpdatePeerProfileData, UpdatePeerProfileVariables>(
    UpdatePeerProfileMutation,
    opts
  )
}

export interface CreatePeerInput {
  name: string
  slug: string
  hostURL: string
  token: string
}

export const CreatePeerMutation = gql`
  mutation CreatePeer($input: CreatePeerInput!) {
    createPeer(input: $input) {
      id
      slug
      name
      hostURL
    }
  }
`

export interface CreatePeerData {
  createPeer: Peer
}

export interface CreatePeerVariables {
  input: CreatePeerInput
}

export function useCreatePeerMutation(
  opts?: MutationHookOptions<CreatePeerData, CreatePeerVariables>
) {
  return useMutation(CreatePeerMutation, opts)
}

export interface UpdatePeerInput {
  name: string
  slug: string
  hostURL: string
  token?: string
}

export const UpdatePeerMutation = gql`
  mutation UpdatePeer($id: ID!, $input: UpdatePeerInput!) {
    updatePeer(id: $id, input: $input) {
      id
      slug
      name
      hostURL
    }
  }
`

export interface UpdatePeerData {
  createPeer: Peer
}

export interface UpdatePeerVariables {
  id: string
  input: UpdatePeerInput
}

export function useUpdatePeerMutation(
  opts?: MutationHookOptions<UpdatePeerData, UpdatePeerVariables>
) {
  return useMutation(UpdatePeerMutation, opts)
}

export const DeletePeerMutation = gql`
  mutation DeletePeer($id: ID!) {
    deletePeer(id: $id)
  }
`

export interface DeletePeerData {
  deletePeer: string
}

export interface DeletePeerVariables {
  id: string
}

export function useDeletePeerMutation(
  opts?: MutationHookOptions<DeletePeerData, DeletePeerVariables>
) {
  return useMutation(DeletePeerMutation, opts)
}
