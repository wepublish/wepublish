import {
  Challenge,
  ChallengeValidationProps,
  ChallengeValidationReturn,
} from './challenge.model';
import { ChallengeProviderType, PrismaClient } from '@prisma/client';

export abstract class ChallengeProvider {
  abstract generateChallenge(): Promise<Challenge>;

  abstract validateChallenge(
    props: ChallengeValidationProps
  ): Promise<ChallengeValidationReturn>;

  public async initDatabaseConfiguration(
    id: string,
    type: ChallengeProviderType,
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
