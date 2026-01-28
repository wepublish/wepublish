import { Prisma, PrismaClient } from '@prisma/client';
import { CanUpdatePeerProfile } from '@wepublish/permissions';
import { Context } from '../../context';
import { authorise } from '../permissions';

export const upsertPeerProfile = async (
  input:
    | Omit<Prisma.PeerProfileUncheckedUpdateInput, 'modifiedAt' | 'createdAt'>
    | Prisma.PeerProfileUncheckedCreateInput,
  hostURL: string,
  authenticate: Context['authenticate'],
  peerProfile: PrismaClient['peerProfile']
) => {
  const { roles } = authenticate();
  authorise(CanUpdatePeerProfile, roles);

  const oldProfile = await peerProfile.findFirst({});

  const data =
    oldProfile ?
      await peerProfile.update({
        where: {
          id: oldProfile.id,
        },
        data: input,
      })
    : await peerProfile.create({
        data: input as Prisma.PeerProfileUncheckedCreateInput,
      });

  return { ...data, hostURL };
};
