import {PrismaClient} from '@prisma/client'
import {GraphQLResolveInfo} from 'graphql'
import {delegateToSchema, introspectSchema, makeRemoteExecutableSchema} from 'graphql-tools'
import {Context, createFetcher} from '../../context'
import {SettingName} from '@wepublish/settings/api'
import {PeerTokenInvalidError} from '../../error'
import {markResultAsProxied} from '../../utility'
import {authorise} from '../permissions'
import {CanCreatePeer, CanGetPeerProfile} from '@wepublish/permissions/api'
import {getPeerProfile} from './peer-profile.queries'

export const getAdminPeerProfile = async (
  hostURL: string,
  websiteURL: string,
  authenticate: Context['authenticate'],
  peerProfile: PrismaClient['peerProfile']
) => {
  const {roles} = authenticate()
  authorise(CanGetPeerProfile, roles)

  return getPeerProfile(hostURL, websiteURL, peerProfile)
}

export const getRemotePeerProfile = async (
  hostURL: string,
  token: string,
  authenticate: Context['authenticate'],
  info: GraphQLResolveInfo,
  setting: PrismaClient['setting']
) => {
  const {roles} = authenticate()
  authorise(CanCreatePeer, roles)
  const link = new URL('v1/admin', hostURL)

  const peerTimeoutSetting = await setting.findUnique({
    where: {
      name: SettingName.PEERING_TIMEOUT_MS
    }
  })

  const peerTimeout =
    (peerTimeoutSetting?.value as number) ?? parseInt(process.env.PEERING_TIMEOUT_IN_MS ?? '')

  if (!peerTimeout) {
    throw new Error('No value set for PEERING_TIMEOUT_IN_MS')
  }

  const fetcher = await createFetcher(link.toString(), token, peerTimeout)
  const schema = await introspectSchema(fetcher)
  const remoteExecutableSchema = await makeRemoteExecutableSchema({
    schema,
    fetcher
  })
  const remoteAnswer = await delegateToSchema({
    info,
    fieldName: 'peerProfile',
    args: {},
    schema: remoteExecutableSchema,
    transforms: []
  })

  if (remoteAnswer?.extensions?.code === 'UNAUTHENTICATED') {
    // check for unauthenticated error and throw more specific error.
    // otherwise client doesn't know who (own or remote api) threw the error
    throw new PeerTokenInvalidError(link.toString())
  } else {
    return await markResultAsProxied(remoteAnswer)
  }
}
