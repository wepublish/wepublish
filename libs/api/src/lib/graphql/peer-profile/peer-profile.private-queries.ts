import {PrismaClient} from '@prisma/client'
import {GraphQLResolveInfo} from 'graphql'
import {delegateToSchema} from '@graphql-tools/delegate'
import {schemaFromExecutor} from '@graphql-tools/wrap'
import {Context, createFetcher} from '../../context'
import {SettingName} from '@wepublish/settings/api'
import {PeerTokenInvalidError} from '../../error'
import {markResultAsProxied} from '../../utility'
import {authorise} from '../permissions'
import {CanCreatePeer, CanGetPeerProfile} from '@wepublish/permissions/api'
import {getPeerProfile} from './peer-profile.queries'
import {z} from 'zod'

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
  const link = z.string().url().parse(hostURL.replace(/\/+$/, ''))

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

  const fetcher = await createFetcher(`${link}/v1`, token, peerTimeout)
  const remoteExecutableSchema = {
    schema: await schemaFromExecutor(fetcher),
    executor: fetcher
  }

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
    throw new PeerTokenInvalidError(link)
  } else {
    return await markResultAsProxied(remoteAnswer)
  }
}
