import {
  Challenge,
  ChallengeValidationProps,
  ChallengeValidationReturn,
} from './challenge.model';
import {
  ChallengeProvider as PrismaChallengeProvider,
  PrismaClient,
} from '@prisma/client';

export abstract class ChallengeProvider {
  abstract generateChallenge(): Promise<Challenge>;

  abstract validateChallenge(
    props: ChallengeValidationProps
  ): Promise<ChallengeValidationReturn>;

  public async initDatabaseConfiguration(
    id: string,
    type: PrismaChallengeProvider,
    prisma: PrismaClient
  ): Promise<void> {
    await prisma.settingChallengeProvider.upsert({
      where: {
        id,
      },
      create: {
        id,
        type,
      },
      update: {},
    });
    return;
  }
}
