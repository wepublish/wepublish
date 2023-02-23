import {Prisma, PrismaClient} from '@prisma/client'
import {Context} from '../../context'
import {authorise} from '../permissions'
import {CanCreatePeer, CanDeletePeer} from '@wepublish/permissions/api'

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
    data: input
  })
}

export const updatePeer = (
  id: string,
  input: Omit<Prisma.PeerUncheckedUpdateInput, 'modifiedAt' | 'createdAt'>,
  authenticate: Context['authenticate'],
  peer: PrismaClient['peer']
) => {
  const {roles} = authenticate()
  authorise(CanCreatePeer, roles)

  const nonEmptyInputs = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value || value === false)
  )

  return peer.update({
    where: {id},
    data: nonEmptyInputs
  })
}
