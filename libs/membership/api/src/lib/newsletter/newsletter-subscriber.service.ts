import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MailLogState,
  NewsletterList,
  NewsletterListLockedDisplay,
  NewsletterListMemberPlan,
  NewsletterSubscriber,
  NewsletterSubscriberSource,
  PrismaClient,
  User,
  UserEvent,
} from '@prisma/client';
import { subSeconds } from 'date-fns';
import { SettingName, SettingsService } from '@wepublish/settings/api';
import { MailContext, mailLogType } from '@wepublish/mail/api';
import {
  AUDIENCE_JWT_SERVICE,
  AudienceJwtService,
  unselectPassword,
} from '@wepublish/authentication/api';
import { NewsletterEligibilityService } from './newsletter-eligibility.service';
import {
  EligibilityList,
  EligibilitySubscription,
  isEligibleForNewsletterList,
} from './newsletter-eligibility';
import {
  MyNewsletterList,
  NewsletterListUserStatus,
} from './my-newsletter-list.model';

export const NEWSLETTER_CONFIRMATION_AUDIENCE = 'newsletter-confirmation';
const CONFIRMATION_EXPIRY_MINUTES = 7 * 24 * 60;
const CONFIRMATION_RESEND_COOLDOWN_SECONDS = 60;

type ListWithMemberPlans = NewsletterList & {
  memberPlans: NewsletterListMemberPlan[];
};

const toEligibilityList = (list: ListWithMemberPlans): EligibilityList => ({
  requiresSubscription: list.requiresSubscription,
  anyMemberPlan: list.anyMemberPlan,
  memberPlanIds: list.memberPlans.map(({ memberPlanId }) => memberPlanId),
});

const statusOf = (
  eligible: boolean,
  entry: NewsletterSubscriber | null | undefined
) => {
  const signedUp = !!entry && !entry.unsubscribedAt;

  if (!eligible) {
    return signedUp ?
        NewsletterListUserStatus.PAUSED
      : NewsletterListUserStatus.LOCKED;
  }

  if (!signedUp) {
    return NewsletterListUserStatus.NOT_SUBSCRIBED;
  }

  return entry.confirmedAt ?
      NewsletterListUserStatus.SUBSCRIBED
    : NewsletterListUserStatus.PENDING;
};

const toMyNewsletterList = (
  list: NewsletterList,
  status: NewsletterListUserStatus
): MyNewsletterList => ({
  id: list.id,
  name: list.name,
  slug: list.slug,
  description: list.description,
  lockedText: list.lockedText,
  lockedLinkUrl: list.lockedLinkUrl,
  status,
});

@Injectable()
export class NewsletterSubscriberService {
  constructor(
    private prisma: PrismaClient,
    private eligibility: NewsletterEligibilityService,
    private settings: SettingsService,
    private mailContext: MailContext,
    @Inject(AUDIENCE_JWT_SERVICE) private jwt: AudienceJwtService
  ) {}

  async getMyLists(userId: string): Promise<MyNewsletterList[]> {
    const [lists, entries, subscriptions] = await Promise.all([
      this.prisma.newsletterList.findMany({
        where: { active: true },
        include: { memberPlans: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.newsletterSubscriber.findMany({ where: { userId } }),
      this.userSubscriptions(userId),
    ]);

    return lists.flatMap(list => {
      const eligible = isEligibleForNewsletterList(
        toEligibilityList(list),
        subscriptions
      );

      const entry = entries.find(({ listId }) => listId === list.id);
      const status = statusOf(eligible, entry);

      if (
        status === NewsletterListUserStatus.LOCKED &&
        list.lockedDisplay === NewsletterListLockedDisplay.hidden
      ) {
        return [];
      }

      return [toMyNewsletterList(list, status)];
    });
  }

  async subscribe(userId: string, listId: string): Promise<MyNewsletterList> {
    const list = await this.activeList(listId);
    const eligible = isEligibleForNewsletterList(
      toEligibilityList(list),
      await this.userSubscriptions(userId)
    );

    if (!eligible) {
      throw new ForbiddenException(
        'This newsletter is only available with a subscription.'
      );
    }

    const existing = await this.prisma.newsletterSubscriber.findUnique({
      where: { userId_listId: { userId, listId } },
    });

    if (existing?.confirmedAt && !existing.unsubscribedAt) {
      return toMyNewsletterList(list, NewsletterListUserStatus.SUBSCRIBED);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: unselectPassword,
    });

    const needsConfirmation =
      !user?.newsletterConfirmedAt && (await this.isDoubleOptInEnabled());

    const mailTemplateId =
      needsConfirmation ?
        await this.mailContext.getUserTemplateId(
          UserEvent.NEWSLETTER_CONFIRMATION,
          true
        )
      : null;

    const now = new Date();
    const recentConfirmationMail =
      mailTemplateId &&
      (await this.prisma.mailLog.findFirst({
        where: {
          recipientID: userId,
          mailTemplateId,
          state: { not: MailLogState.rejected },
          sentDate: {
            gte: subSeconds(now, CONFIRMATION_RESEND_COOLDOWN_SECONDS),
          },
        },
      }));

    const confirmedAt = needsConfirmation ? null : now;
    const entry = await this.prisma.newsletterSubscriber.upsert({
      where: { userId_listId: { userId, listId } },
      create: {
        userId,
        listId,
        source: NewsletterSubscriberSource.self,
        subscribedAt: now,
        confirmedAt,
      },
      update: {
        source: NewsletterSubscriberSource.self,
        subscribedAt: now,
        confirmedAt,
        unsubscribedAt: null,
      },
    });

    if (mailTemplateId && user && !recentConfirmationMail) {
      await this.mailContext.sendMail({
        mailTemplateId,
        recipient: user as User,
        optionalData: {
          newsletterList: { id: list.id, name: list.name, slug: list.slug },
          confirmToken: await this.jwt.generateJWT({
            id: userId,
            audience: NEWSLETTER_CONFIRMATION_AUDIENCE,
            expiresInMinutes: CONFIRMATION_EXPIRY_MINUTES,
          }),
        },
        mailType: mailLogType.UserFlow,
      });
    }

    return toMyNewsletterList(list, statusOf(true, entry));
  }

  async unsubscribe(userId: string, listId: string): Promise<MyNewsletterList> {
    const list = await this.prisma.newsletterList.findUnique({
      where: { id: listId },
      include: { memberPlans: true },
    });

    if (!list) {
      throw new NotFoundException(
        `Newsletter list with id ${listId} not found`
      );
    }

    const existing = await this.prisma.newsletterSubscriber.findUnique({
      where: { userId_listId: { userId, listId } },
    });

    const entry =
      existing && !existing.unsubscribedAt ?
        await this.prisma.newsletterSubscriber.update({
          where: { id: existing.id },
          data: { unsubscribedAt: new Date() },
        })
      : existing;

    const eligible = isEligibleForNewsletterList(
      toEligibilityList(list),
      await this.userSubscriptions(userId)
    );

    return toMyNewsletterList(list, statusOf(eligible, entry));
  }

  async confirm(token: string): Promise<MyNewsletterList[]> {
    const userId = await this.jwt
      .verifyJWT(token, NEWSLETTER_CONFIRMATION_AUDIENCE)
      .catch(() => null);

    if (!userId) {
      throw new BadRequestException(
        'The newsletter confirmation link is invalid or has expired.'
      );
    }

    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { newsletterConfirmedAt: now },
      }),
      this.prisma.newsletterSubscriber.updateMany({
        where: { userId, confirmedAt: null, unsubscribedAt: null },
        data: { confirmedAt: now },
      }),
    ]);

    return this.getMyLists(userId);
  }

  async autoSubscribe(userId: string, memberPlanId: string): Promise<void> {
    const lists = await this.prisma.newsletterList.findMany({
      where: {
        active: true,
        requiresSubscription: true,
        autoSubscribe: true,
        OR: [
          { anyMemberPlan: true },
          { memberPlans: { some: { memberPlanId } } },
        ],
      },
      select: { id: true },
    });

    if (!lists.length) {
      return;
    }

    const listIds = lists.map(({ id }) => id);
    const now = new Date();

    await this.prisma.newsletterSubscriber.createMany({
      skipDuplicates: true,
      data: listIds.map(listId => ({
        userId,
        listId,
        source: NewsletterSubscriberSource.auto,
        subscribedAt: now,
        confirmedAt: now,
      })),
    });

    await this.prisma.newsletterSubscriber.updateMany({
      where: {
        userId,
        listId: { in: listIds },
        confirmedAt: null,
        unsubscribedAt: null,
      },
      data: { confirmedAt: now },
    });
  }

  private async activeList(listId: string): Promise<ListWithMemberPlans> {
    const list = await this.prisma.newsletterList.findUnique({
      where: { id: listId },
      include: { memberPlans: true },
    });

    if (!list?.active) {
      throw new NotFoundException(
        `Newsletter list with id ${listId} not found`
      );
    }

    return list;
  }

  private async userSubscriptions(
    userId: string
  ): Promise<EligibilitySubscription[]> {
    return (
      (await this.eligibility.subscriptionsByUser([userId])).get(userId) ?? []
    );
  }

  private async isDoubleOptInEnabled(): Promise<boolean> {
    try {
      const setting = await this.settings.settingByName(
        SettingName.NEWSLETTER_DOUBLE_OPT_IN
      );

      return setting.value === true;
    } catch {
      return false;
    }
  }
}
