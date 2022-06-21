import {Prisma, PrismaClient} from '@prisma/client'
import {Context} from '../../context'
import {authorise, CanUpdatePeerProfile} from '../permissions'

export const upsertPeerProfile = async (
  input:
    | Omit<Prisma.PeerProfileUncheckedUpdateInput, 'modifiedAt' | 'createdAt'>
    | Prisma.PeerProfileUncheckedCreateInput,
  hostURL: string,
  authenticate: Context['authenticate'],
  peerProfile: PrismaClient['peerProfile']
) => {
  const {roles} = authenticate()
  authorise(CanUpdatePeerProfile, roles)

  const data = await peerProfile.upsert({
    where: {},
    create: input as Prisma.PeerProfileUncheckedCreateInput,
    update: input
  })

  return {...data, hostURL}
}
