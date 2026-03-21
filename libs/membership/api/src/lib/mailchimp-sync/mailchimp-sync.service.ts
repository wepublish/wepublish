import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient, SettingSyncProvider } from '@prisma/client';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { createHash } from 'crypto';
import { isWithinInterval, subDays } from 'date-fns';
import { SyncProviderSettingsService } from '@wepublish/settings/api';

interface UserAndSubscriptions {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    name: string;
  };
  subscriptions: {
    id: string;
    paidUntil: Date | null;
    memberPlan: {
      slug: string;
    };
    paymentMethod: {
      slug: string;
    };
  }[];
  currentSubscription?: {
    id: string;
    paidUntil: Date | null;
    memberPlan: {
      slug: string;
    };
    paymentMethod: {
      slug: string;
    };
  };
  lastSubscription?: {
    id: string;
    paidUntil: Date | null;
    memberPlan: {
      slug: string;
    };
    paymentMethod: {
      slug: string;
    };
  };
}

interface MergeFieldMapping {
  tag: string;
  expression: string;
}

interface InterestGroupMapping {
  groupId: string;
  expression: string;
}

export interface DryRunChange {
  email: string;
  isNew: boolean;
  mergeFields: Record<string, string>;
  interests: Record<string, boolean>;
  previousMergeFields: Record<string, string> | null;
  previousInterests: Record<string, boolean> | null;
}

export interface DryRunResult {
  updatedCount: number;
  skippedCount: number;
  totalUserCount: number;
  changes: DryRunChange[];
}

@Injectable()
export class MailchimpSyncService {
  private logger = new Logger('MailchimpSyncService');

  constructor(
    private prisma: PrismaClient,
    private syncProviderSettingsService: SyncProviderSettingsService
  ) {}

  /**
   * Execute sync for all enabled configurations.
   */
  async executeAllSync(): Promise<void> {
    const configs =
      await this.syncProviderSettingsService.getEnabledSyncConfigs();

    for (const config of configs) {
      try {
        this.logger.log(
          `Starting Mailchimp sync for "${config.name || config.id}"...`
        );
        await this.executeSyncForConfig(config);
        await this.syncProviderSettingsService.updateSyncResult(config.id);
        this.logger.log(
          `Mailchimp sync for "${config.name || config.id}" completed successfully.`
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Mailchimp sync failed for "${config.name || config.id}": ${errorMessage}`
        );
        await this.syncProviderSettingsService.updateSyncResult(
          config.id,
          errorMessage
        );
      }
    }
  }

  /**
   * Execute sync for a single configuration by ID.
   */
  async executeSyncById(
    id: string,
    dryRun = false,
    limit?: number
  ): Promise<DryRunResult | null> {
    const config = await this.getConfigById(id);
    const result = await this.executeSyncForConfig(config, dryRun, limit);

    if (!dryRun) {
      await this.syncProviderSettingsService.updateSyncResult(config.id);
    }

    return result;
  }

  private async executeSyncForConfig(
    config: SettingSyncProvider & { decryptedApiKey: string | null },
    dryRun = false,
    limit?: number
  ): Promise<DryRunResult | null> {
    if (!config.mailchimp_listId) {
      throw new Error('Missing Mailchimp list ID');
    }

    this.configureMailchimpClient(config);

    const mergeFieldMappings = (config.mailchimp_mergeFieldMappings ??
      []) as unknown as MergeFieldMapping[];
    const interestGroupMappings = (config.mailchimp_interestGroupMappings ??
      []) as unknown as InterestGroupMapping[];
    const defaultInterestGroupIds = (config.mailchimp_defaultInterestGroupIds ??
      []) as unknown as string[];

    // Fetch existing Mailchimp contacts
    const mailchimpContacts = await this.getMailchimpContacts(
      config.mailchimp_listId
    );
    const mailchimpContactMap = new Map(
      mailchimpContacts.map(m => [m.email_address?.toLowerCase(), m])
    );

    // Fetch all users with subscriptions via Prisma
    const usersWithSubscriptions = await this.getUsersWithSubscriptions();

    // Pre-load users with sync errors to skip them
    const recentErrorUserIds = await this.getRecentSyncErrorUserIds(config.id);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let processedCount = 0;
    const changes: DryRunChange[] = [];

    for (const userWithSub of usersWithSubscriptions) {
      if (!userWithSub.user.email) continue;
      if (limit && processedCount >= limit) break;

      if (recentErrorUserIds.has(userWithSub.user.id)) {
        skippedCount++;
        continue;
      }

      processedCount++;

      const mergeFields: Record<string, string> = {};
      for (const mapping of mergeFieldMappings) {
        mergeFields[mapping.tag] = this.evaluateMergeFieldExpression(
          mapping.expression,
          userWithSub
        );
      }

      const interests: Record<string, boolean> = {};
      for (const mapping of interestGroupMappings) {
        const isDefault = defaultInterestGroupIds.includes(mapping.groupId);
        interests[mapping.groupId] =
          isDefault ||
          this.evaluateInterestGroupExpression(mapping.expression, userWithSub);
      }

      // Check if update is needed
      const existingContact = mailchimpContactMap.get(
        userWithSub.user.email.toLowerCase()
      );

      if (
        existingContact &&
        this.hasDesiredValues(existingContact.merge_fields, mergeFields) &&
        this.hasDesiredValues(existingContact.interests, interests)
      ) {
        skippedCount++;
        continue;
      }

      if (dryRun) {
        changes.push({
          email: userWithSub.user.email,
          isNew: !existingContact,
          mergeFields,
          interests,
          previousMergeFields: existingContact?.merge_fields ?? null,
          previousInterests: existingContact?.interests ?? null,
        });
      } else {
        try {
          await this.upsertMailchimpContact(config.mailchimp_listId!, {
            email: userWithSub.user.email,
            mergeFields,
            interests,
          });
        } catch (error: any) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          const statusCode =
            error?.response?.body?.status ?? error?.status ?? null;
          this.logger.warn(
            `Failed to update contact '${userWithSub.user.email}': ${errorMessage}`
          );
          await this.recordSyncError(
            config.id,
            userWithSub.user.id,
            userWithSub.user.email,
            errorMessage,
            statusCode
          );
          errorCount++;
          continue;
        }
      }
      updatedCount++;
    }

    this.logger.log(
      `Sync ${dryRun ? '(DRY RUN) ' : ''}complete: ${updatedCount} ${dryRun ? 'would be ' : ''}updated, ${skippedCount} skipped${errorCount > 0 ? `, ${errorCount} errors` : ''}`
    );

    if (dryRun) {
      return {
        updatedCount,
        skippedCount,
        totalUserCount: usersWithSubscriptions.length,
        changes,
      };
    }

    return null;
  }

  private async getUsersWithSubscriptions(): Promise<UserAndSubscriptions[]> {
    const users = await this.prisma.user.findMany({
      where: { active: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        name: true,
      },
    });

    const now = new Date();

    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        deactivation: null,
      },
      select: {
        id: true,
        userID: true,
        paidUntil: true,
        memberPlan: {
          select: { slug: true },
        },
        paymentMethod: {
          select: { slug: true },
        },
      },
    });

    const subsByUser = new Map<string, typeof subscriptions>();
    for (const sub of subscriptions) {
      const existing = subsByUser.get(sub.userID) ?? [];
      existing.push(sub);
      subsByUser.set(sub.userID, existing);
    }

    return users.map(user => {
      const userSubs = subsByUser.get(user.id) ?? [];

      const currentSubscription = userSubs
        .filter(s => s.paidUntil && s.paidUntil > now)
        .sort(
          (a, b) =>
            (b.paidUntil?.getTime() ?? 0) - (a.paidUntil?.getTime() ?? 0)
        )[0];

      const lastSubscription = [...userSubs].sort(
        (a, b) => (b.paidUntil?.getTime() ?? 0) - (a.paidUntil?.getTime() ?? 0)
      )[0];

      return {
        user,
        subscriptions: userSubs,
        currentSubscription,
        lastSubscription,
      };
    });
  }

  private async getMailchimpContacts(listId: string): Promise<any[]> {
    const allMembers: any[] = [];
    let offset = 0;
    const batchSize = 500;

    while (true) {
      let response: any;
      try {
        response = await mailchimp.lists.getListMembersInfo(listId, {
          offset,
          count: batchSize,
        });
      } catch (error: any) {
        const detail =
          error?.response?.body?.detail ?? error?.message ?? String(error);
        const title = error?.response?.body?.title ?? 'Mailchimp API error';
        const status = error?.response?.body?.status ?? error?.status;
        throw new Error(`${title} (${status}): ${detail}`);
      }

      if (response.status && response.detail) {
        throw new Error(
          `Mailchimp API error: ${response.title} - ${response.detail}`
        );
      }

      allMembers.push(...(response.members ?? []));

      if (offset + batchSize >= (response.total_items ?? 0)) {
        break;
      }
      offset += batchSize;
    }

    return allMembers;
  }

  private async upsertMailchimpContact(
    listId: string,
    data: {
      email: string;
      mergeFields: Record<string, string>;
      interests: Record<string, boolean>;
    }
  ): Promise<void> {
    const email = data.email.trim().toLowerCase();
    const subscriberHash = createHash('md5').update(email).digest('hex');

    try {
      await mailchimp.lists.setListMember(listId, subscriberHash, {
        email_address: data.email.trim(),
        status_if_new: 'subscribed',
        merge_fields: data.mergeFields,
        interests: data.interests,
      });
    } catch (error: any) {
      const detail =
        error?.response?.body?.detail ?? error?.message ?? String(error);
      const title = error?.response?.body?.title ?? 'Mailchimp API error';
      throw new Error(
        `Error updating contact '${data.email}': ${title} - ${detail}`
      );
    }
  }

  /**
   * Evaluate a merge field expression against user/subscription data.
   *
   * Supports pipe `|` as OR: first non-empty result wins.
   * E.g. "slug:contains:firmen-abo|slug:contains:gonner"
   *
   * Single expression formats:
   * - "user.firstName" / "user.name" - direct user field access
   * - "slug:contains:value" - "1" if current subscription plan slug contains value, else "0"
   * - "slug:contains_any:val1,val2" - "1" if current slug contains any of the values
   * - "slug:equals:value" - "1" if current subscription plan slug equals value
   * - "active_abo" - "1" if active, "-1" if past subscriptions, "" if none
   * - "active_abo_with_payment:method_slug:days" - like active_abo but also returns "1"
   *     if last subscription has given payment method and paidUntil within N days
   * - "retarget:days" - "1" if last subscription paidUntil within N days, else ""
   * - "static:value" - always returns the given value
   */
  private evaluateMergeFieldExpression(
    expression: string,
    data: UserAndSubscriptions
  ): string {
    // Support OR via pipe separator
    if (expression.includes('|')) {
      for (const subExpr of expression.split('|')) {
        const result = this.evaluateSingleMergeField(subExpr.trim(), data);
        if (result !== '' && result !== '0') return result;
      }
      return '0';
    }

    return this.evaluateSingleMergeField(expression, data);
  }

  private evaluateSingleMergeField(
    expression: string,
    data: UserAndSubscriptions
  ): string {
    const parts = expression.split(':');
    const type = parts[0];

    switch (type) {
      case 'user.firstName':
        return data.user.firstName || 'Unbekannt';

      case 'user.name':
        return data.user.name || 'Unbekannt';

      case 'slug': {
        const op = parts[1];
        const value = parts.slice(2).join(':');
        if (op === 'contains') {
          return data.currentSubscription?.memberPlan.slug.includes(value) ?
              '1'
            : '0';
        }
        if (op === 'contains_any') {
          const values = value.split(',');
          return (
              values.some(v =>
                data.currentSubscription?.memberPlan.slug.includes(v.trim())
              )
            ) ?
              '1'
            : '0';
        }
        if (op === 'equals') {
          return data.currentSubscription?.memberPlan.slug === value ?
              '1'
            : '0';
        }
        return '0';
      }

      case 'active_abo': {
        if (data.currentSubscription) return '1';
        if (data.subscriptions.length > 0) return '-1';
        return '';
      }

      case 'active_abo_with_payment': {
        // active_abo_with_payment:bexio:30
        // Returns "1" if active, or if last sub has matching payment method
        // and paidUntil is within N days. Otherwise "-1" if any subs, "" if none.
        const paymentSlug = parts[1];
        const days = parseInt(parts[2] ?? '30', 10);

        if (data.currentSubscription) return '1';
        if (
          paymentSlug &&
          data.lastSubscription?.paymentMethod.slug === paymentSlug &&
          data.lastSubscription?.paidUntil &&
          this.isWithinLastXDays(data.lastSubscription.paidUntil, days)
        ) {
          return '1';
        }
        if (data.subscriptions.length > 0) return '-1';
        return '';
      }

      case 'retarget': {
        const days = parseInt(parts[1] ?? '45', 10);
        if (
          data.lastSubscription?.paidUntil &&
          this.isWithinLastXDays(data.lastSubscription.paidUntil, days)
        ) {
          return '1';
        }
        return '';
      }

      case 'static':
        return parts.slice(1).join(':');

      default:
        return '';
    }
  }

  /**
   * Evaluate an interest group expression.
   * Supported formats:
   * - "slug:equals:value" - true if last subscription plan slug matches
   * - "slug:contains:value" - true if last subscription plan slug contains value
   * - "slug:contains_any:val1,val2" - true if last slug contains any value
   */
  private evaluateInterestGroupExpression(
    expression: string,
    data: UserAndSubscriptions
  ): boolean {
    const parts = expression.split(':');
    const type = parts[0];

    switch (type) {
      case 'always':
        return true;

      case 'slug': {
        const op = parts[1];
        const value = parts.slice(2).join(':');
        if (op === 'equals') {
          return data.lastSubscription?.memberPlan.slug === value;
        }
        if (op === 'contains') {
          return (
            data.lastSubscription?.memberPlan.slug.includes(value) ?? false
          );
        }
        if (op === 'contains_any') {
          const values = value.split(',');
          return values.some(
            v =>
              data.lastSubscription?.memberPlan.slug.includes(v.trim()) ?? false
          );
        }
        return false;
      }

      default:
        return false;
    }
  }

  private isWithinLastXDays(date: Date, days: number): boolean {
    try {
      return isWithinInterval(date, {
        start: subDays(new Date(), days),
        end: new Date(),
      });
    } catch {
      return false;
    }
  }

  /**
   * Check if the existing Mailchimp contact already has the desired values.
   * Only compares keys present in `desired` (our mapped fields),
   * ignoring extra fields returned by Mailchimp.
   */
  private hasDesiredValues(existing: any, desired: any): boolean {
    if (!existing || !desired) return false;
    for (const key of Object.keys(desired)) {
      if (existing[key] !== desired[key]) return false;
    }
    return true;
  }

  private configureMailchimpClient(
    config: SettingSyncProvider & { decryptedApiKey: string | null }
  ): void {
    if (!config.decryptedApiKey) {
      throw new Error('Missing Mailchimp API key');
    }

    const server = config.decryptedApiKey.split('-')[1];
    if (!server) {
      throw new Error('Invalid Mailchimp API key format (expected key-server)');
    }

    mailchimp.setConfig({
      apiKey: config.decryptedApiKey,
      server,
    });
  }

  async getMailchimpLists(
    configId: string
  ): Promise<{ id: string; name: string; memberCount: number }[]> {
    const config = await this.getConfigById(configId);
    this.configureMailchimpClient(config);

    try {
      const response = (await mailchimp.lists.getAllLists({
        count: 100,
      })) as any;

      return (response.lists ?? []).map((list: any) => ({
        id: list.id,
        name: list.name,
        memberCount: list.stats?.member_count ?? 0,
      }));
    } catch (error: any) {
      const detail =
        error?.response?.body?.detail ?? error?.message ?? String(error);
      const title = error?.response?.body?.title ?? 'Mailchimp API error';
      throw new Error(`${title}: ${detail}`);
    }
  }

  async getMailchimpMergeFields(
    configId: string,
    listId: string
  ): Promise<{ tag: string; name: string; type: string }[]> {
    const config = await this.getConfigById(configId);
    this.configureMailchimpClient(config);

    try {
      const response = (await mailchimp.lists.getListMergeFields(listId, {
        count: 100,
      })) as any;

      return (response.merge_fields ?? []).map((field: any) => ({
        tag: field.tag,
        name: field.name,
        type: field.type,
      }));
    } catch (error: any) {
      const detail =
        error?.response?.body?.detail ?? error?.message ?? String(error);
      const title = error?.response?.body?.title ?? 'Mailchimp API error';
      throw new Error(`${title}: ${detail}`);
    }
  }

  async getMailchimpInterestCategories(
    configId: string,
    listId: string
  ): Promise<{ id: string; name: string }[]> {
    const config = await this.getConfigById(configId);
    this.configureMailchimpClient(config);

    try {
      const response = (await (
        mailchimp.lists as any
      ).getListInterestCategories(listId, { count: 100 })) as any;

      const categories: { id: string; name: string }[] = [];

      for (const category of response.categories ?? []) {
        const interestsResponse = (await (
          mailchimp.lists as any
        ).listInterestCategoryInterests(listId, category.id, {
          count: 100,
        })) as any;

        for (const interest of interestsResponse.interests ?? []) {
          categories.push({
            id: interest.id,
            name: `${category.title}: ${interest.name}`,
          });
        }
      }

      return categories;
    } catch (error: any) {
      const detail =
        error?.response?.body?.detail ?? error?.message ?? String(error);
      const title = error?.response?.body?.title ?? 'Mailchimp API error';
      throw new Error(`${title}: ${detail}`);
    }
  }

  private async getConfigById(
    id: string
  ): Promise<SettingSyncProvider & { decryptedApiKey: string | null }> {
    const configs =
      await this.syncProviderSettingsService.getEnabledSyncConfigs();
    const config = configs.find(c => c.id === id);

    if (!config) {
      throw new Error(`Mailchimp sync config "${id}" not found or not enabled`);
    }

    return config;
  }

  // --- Sync Error Management ---

  private async getRecentSyncErrorUserIds(
    syncProviderId: string
  ): Promise<Set<string>> {
    const errors = await this.prisma.mailchimpSyncError.findMany({
      where: { syncProviderId },
      select: { userId: true },
    });
    return new Set(errors.map(e => e.userId));
  }

  private async recordSyncError(
    syncProviderId: string,
    userId: string,
    email: string,
    errorMessage: string,
    statusCode: number | null
  ): Promise<void> {
    await this.prisma.mailchimpSyncError.upsert({
      where: {
        userId_syncProviderId: { userId, syncProviderId },
      },
      create: { userId, syncProviderId, email, errorMessage, statusCode },
      update: { email, errorMessage, statusCode },
    });
  }

  async getSyncErrors(syncProviderId: string, take = 20, skip = 0) {
    const [nodes, totalCount] = await Promise.all([
      this.prisma.mailchimpSyncError.findMany({
        where: { syncProviderId },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.mailchimpSyncError.count({
        where: { syncProviderId },
      }),
    ]);

    return { nodes, totalCount };
  }

  async deleteSyncError(id: string): Promise<void> {
    await this.prisma.mailchimpSyncError.delete({ where: { id } });
  }

  async deleteAllSyncErrors(syncProviderId: string): Promise<void> {
    await this.prisma.mailchimpSyncError.deleteMany({
      where: { syncProviderId },
    });
  }
}
