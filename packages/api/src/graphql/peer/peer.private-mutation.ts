import {Context} from '../../context'
import {authorise, CanDeletePeer} from '../permissions'
import {PrismaClient} from '@prisma/client'

export const deletePeerById = (
  id: string,
  authenticate: Context['authenticate'],
  peer: PrismaClient['peer']
) => {
  const {roles} = authenticate()
  authorise(CanDeletePeer, roles)

  return peer.delete({
    where: {
      id
    }
  })
}
