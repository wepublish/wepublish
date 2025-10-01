import { PrismaClient } from '@prisma/client';
import { Context } from '../../context';

export const revokeSessionById = (
  id: string,
  authenticateUser: Context['authenticateUser'],
  session: PrismaClient['session']
) => {
  const { user } = authenticateUser();

  return session.deleteMany({
    where: {
      id,
      userID: user.id,
    },
  });
};
