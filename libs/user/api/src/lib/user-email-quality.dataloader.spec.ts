import { EmailQualityLevel } from '@prisma/client';
import { UserEmailQualityDataloader } from './user-email-quality.dataloader';

describe('UserEmailQualityDataloader', () => {
  const row = (userId: string, level: EmailQualityLevel) => ({
    userId,
    email: `${userId}@example.com`,
    level,
    reason: level === EmailQualityLevel.dead ? 'hardBounce' : 'login',
    since: new Date('2026-10-01T00:00:00Z'),
    lastEvaluatedAt: new Date('2026-10-12T03:00:00Z'),
    modifiedAt: new Date('2026-10-12T03:00:00Z'),
  });

  const makeLoader = (rows: ReturnType<typeof row>[]) => {
    const findMany = vi.fn(async () => rows);

    return {
      findMany,
      loader: new UserEmailQualityDataloader({
        userEmailQuality: { findMany },
      } as any),
    };
  };

  it('loads the levels of several users in one query', async () => {
    const { findMany, loader } = makeLoader([
      row('b', EmailQualityLevel.dead),
      row('a', EmailQualityLevel.active),
    ]);

    const [a, b] = await Promise.all([loader.load('a'), loader.load('b')]);

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith({
      where: { userId: { in: ['a', 'b'] } },
    });
    expect(a).toMatchObject({
      level: EmailQualityLevel.active,
      reason: 'login',
    });
    expect(b).toMatchObject({ level: EmailQualityLevel.dead });
  });

  it('is null for a user without a level', async () => {
    const { loader } = makeLoader([]);

    await expect(loader.load('nobody')).resolves.toBeNull();
  });
});
