import {Prisma, PrismaClient} from '@prisma/client'
import {Context} from '../../context'
import {authorise, CanCreatePeer, CanDeletePeer} from '../permissions'

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

export const createPeer = (
  input: Omit<Prisma.PeerUncheckedCreateInput, 'modifiedAt'>,
  authenticate: Context['authenticate'],
  peer: PrismaClient['peer']
) => {
  const {roles} = authenticate()
  authorise(CanCreatePeer, roles)

  return peer.create({
    data: {...input, modifiedAt: new Date()}
  })
}
