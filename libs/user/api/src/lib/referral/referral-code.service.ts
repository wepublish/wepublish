import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { randomInt } from 'crypto';

// Without 0/O and 1/I/L, so a code read out loud or typed is not mistaken.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LENGTH = 8;
const MAX_ATTEMPTS = 5;

const generateReferralCode = () =>
  Array.from(
    { length: LENGTH },
    () => ALPHABET[randomInt(ALPHABET.length)]
  ).join('');

export const normalizeReferralCode = (code: string) =>
  code.trim().toUpperCase();

@Injectable()
export class ReferralCodeService {
  constructor(private prisma: PrismaClient) {}

  /**
   * The code a reader shares in their referral link. Created on first use.
   */
  async getReferralCode(userId: string): Promise<string> {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { referralCode: true },
      });

      if (!user) {
        throw new NotFoundException(`User with id ${userId} was not found.`);
      }

      if (user.referralCode) {
        return user.referralCode;
      }

      try {
        // Only when the user still has none, so parallel calls end up with the same code.
        await this.prisma.user.updateMany({
          where: { id: userId, referralCode: null },
          data: { referralCode: generateReferralCode() },
        });
      } catch (error) {
        const taken =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002';

        if (!taken) {
          throw error;
        }
      }
    }

    throw new Error(`Could not create a referral code for user ${userId}.`);
  }

  /**
   * The id of the active user a referral code belongs to, or null.
   */
  async findReferrerId(code: string): Promise<string | null> {
    const user = await this.prisma.user.findFirst({
      where: { referralCode: normalizeReferralCode(code), active: true },
      select: { id: true },
    });

    return user?.id ?? null;
  }
}
