import {PrismaClient} from '@prisma/client'
import {GraphQLResolveInfo} from 'graphql'
import {delegateToSchema, introspectSchema, makeRemoteExecutableSchema} from 'graphql-tools'
import {Context, createFetcher} from '../../context'
import {SettingName} from '../../db/setting'
import {PeerTokenInvalidError, DisabledNewsroomError} from '../../error'
import {markResultAsProxied} from '../../utility'
import {authorise, CanCreateNewsroom, CanGetNewsroom, CanGetNewsrooms} from '../permissions'
import {getOwnNewsroom} from './newsroom.queries'

export const getAdminPeerProfile = async (
  hostURL: string,
  websiteURL: string,
  authenticate: Context['authenticate'],
  newsroom: PrismaClient['newsroom']
) => {
  const {roles} = authenticate()
  authorise(CanGetNewsroom, roles)

  return getOwnNewsroom(hostURL, websiteURL, newsroom)
}

export const getRemotePeerProfile = async (
  hostURL: string,
  token: string,
  authenticate: Context['authenticate'],
  info: GraphQLResolveInfo,
  setting: PrismaClient['setting']
) => {
  const {roles} = authenticate()
  authorise(CanCreateNewsroom, roles)
  const link = new URL('/admin', hostURL)

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

export const getNewsroomById = async (
  id: string,
  authenticate: Context['authenticate'],
  newsroomClient: Context['loaders']['newsroom']
) => {
  const {roles} = authenticate()
  authorise(CanGetNewsroom, roles)

  const newsroom = await newsroomClient.load(id)

  if (newsroom?.isDisabled) {
    throw new DisabledNewsroomError()
  }

  return newsroom
}

export const getNewsrooms = async (
  authenticate: Context['authenticate'],
  newsroom: PrismaClient['newsroom']
) => {
  const {roles} = authenticate()
  authorise(CanGetNewsrooms, roles)

  return newsroom.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  })
}
