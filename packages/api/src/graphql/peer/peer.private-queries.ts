import {Context} from '../../context'
import {authorise, CanGetPeer, CanGetPeers} from '../permissions'
import {PrismaClient} from '@prisma/client'

export const getPeerById = (
  id: string,
  authenticate: Context['authenticate'],
  peer: Context['loaders']['peer']
) => {
  const {roles} = authenticate()
  authorise(CanGetPeer, roles)

  return peer.load(id)
}

export const getPeers = (authenticate: Context['authenticate'], peer: PrismaClient['peer']) => {
  const {roles} = authenticate()
  authorise(CanGetPeers, roles)

  return peer.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  })
}
