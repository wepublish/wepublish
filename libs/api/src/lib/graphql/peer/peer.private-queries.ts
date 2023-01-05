import {Context} from '../../context'
import {authorise, CanGetPeer, CanGetPeers} from '../permissions'
import {PrismaClient} from '@prisma/client'
import {DisabledPeerError} from '../../error'

export const getPeerById = async (
  id: string,
  authenticate: Context['authenticate'],
  peerClient: Context['loaders']['peer']
) => {
  const {roles} = authenticate()
  authorise(CanGetPeer, roles)

  const peer = await peerClient.load(id)

  if (peer?.isDisabled) {
    throw new DisabledPeerError()
  }

  return peer
}

export const getPeers = async (
  authenticate: Context['authenticate'],
  peer: PrismaClient['peer']
) => {
  const {roles} = authenticate()
  authorise(CanGetPeers, roles)

  return peer.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  })
}
