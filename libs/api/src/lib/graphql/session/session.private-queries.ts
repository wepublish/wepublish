import { Context } from '../../context';
import { PrismaClient } from '@prisma/client';
import { AuthSessionType } from '@wepublish/authentication/api';

export const getSessionsForUser = async (
  authenticateUser: Context['authenticateUser'],
  session: PrismaClient['session'],
  userRole: PrismaClient['userRole']
) => {
  const { user } = authenticateUser();

  const [sessions, roles] = await Promise.all([
    session.findMany({
      where: {
        userID: user.id,
      },
    }),
    userRole.findMany({
      where: {
        id: {
          in: user.roleIDs,
        },
      },
    }),
  ]);

  return sessions.map(session => ({
    ...session,
    type: AuthSessionType.User,
    user,
    roles,
  }));
};
