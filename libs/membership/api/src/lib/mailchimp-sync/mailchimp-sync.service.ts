import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient, SettingSyncProvider } from '@prisma/client';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { createHash } from 'crypto';
import { isWithinInterval, subDays } from 'date-fns';
import { SyncProviderSettingsService } from '@wepublish/settings/api';
import {
  CLICK_TRACKING_EXTENSION_TYPE,
  ClickTrackingExtension,
  ClickTrackingExtensionConfig,
} from './extensions/click-tracking.extension';

interface SubscriptionLite {
  id: string;
  paidUntil: Date | null;
  startsAt: Date;
  autoRenew: boolean;
  memberPlan: {
    slug: string;
  };
  paymentMethod: {
    slug: string;
  };
  deactivation: { id: string } | null;
  replacesSubscriptionID: string | null;
}

interface UserAndSubscriptions {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    name: string;
  };
  subscriptions: SubscriptionLite[];
  currentSubscription?: SubscriptionLite;
  lastSubscription?: SubscriptionLite;
}

// Window in which a new subscription still counts as "genuinely new" for
// the purpose of flipping a Mailchimp interest group to true. Outside this
// window the sync preserves whatever value Mailchimp already has.
const NEW_SUBSCRIPTION_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

// Maximum gap between an expired auto-renew predecessor's paidUntil and a
// new subscription's startsAt that still counts as a "renewal" rather than
// an independent re-subscription. If the gap exceeds this, the new sub is
// treated as genuinely new even though an old expired auto-renew sub exists.
const RENEWAL_PROXIMITY_MS = 30 * 24 * 60 * 60 * 1000;

// Maximum time a subscription whose paidUntil has elapsed is still
// considered to be in a grace / renewal-in-progress period. Once
// this window expires the subscription is treated as definitively
// ended even if autoRenew is still true and no deactivation exists.
const GRACE_PERIOD_MS = 45 * 24 * 60 * 60 * 1000;

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

export interface SyncProgress {
  status: 'running' | 'completed' | 'failed';
  processed: number;
  total: number;
  updated: number;
  skipped: number;
  errors: number;
  startedAt: Date;
  finishedAt: Date | null;
  errorMessage: string | null;
}

@Injectable()
export class MailchimpSyncService {
  private logger = new Logger('MailchimpSyncService');
  private static syncProgress = new Map<string, SyncProgress>();

  constructor(
    private prisma: PrismaClient,
    private syncProviderSettingsService: SyncProviderSettingsService,
    private clickTrackingExtension: ClickTrackingExtension
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

  /**
   * Start sync in background (fire-and-forget). Returns immediately.
   */
  startSyncInBackground(id: string): void {
    const existing = MailchimpSyncService.syncProgress.get(id);
    if (existing?.status === 'running') {
      throw new Error('Sync is already running for this configuration');
    }

    MailchimpSyncService.syncProgress.set(id, {
      status: 'running',
      processed: 0,
      total: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      startedAt: new Date(),
      finishedAt: null,
      errorMessage: null,
    });

    this.executeSyncById(id)
      .then(() => {
        const progress = MailchimpSyncService.syncProgress.get(id);
        if (progress) {
          progress.status = 'completed';
          progress.finishedAt = new Date();
        }
      })
      .catch(error => {
        const progress = MailchimpSyncService.syncProgress.get(id);
        if (progress) {
          progress.status = 'failed';
          progress.finishedAt = new Date();
          progress.errorMessage =
            error instanceof Error ? error.message : String(error);
        }
      });
  }

  getSyncProgress(configId: string): SyncProgress | null {
    return MailchimpSyncService.syncProgress.get(configId) ?? null;
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

    // Fetch all users with subscriptions via Prisma
    const usersWithSubscriptions = await this.getUsersWithSubscriptions();

    // Pre-load users with sync errors to skip them
    const recentErrorUserIds = await this.getRecentSyncErrorUserIds(config.id);

    // For limited dry runs, skip the full audience fetch (can be tens of
    // thousands of contacts) and look up only the candidate users' contacts
    // in parallel batches. Otherwise pre-load the full audience.
    const useTargetedContactFetch = dryRun && !!limit && limit > 0;

    // For a limited dry run, randomise the user order so the sample is
    // distributed across the pool instead of always picking the first N.
    if (useTargetedContactFetch) {
      for (let i = usersWithSubscriptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [usersWithSubscriptions[i], usersWithSubscriptions[j]] = [
          usersWithSubscriptions[j],
          usersWithSubscriptions[i],
        ];
      }
    }

    // Build a mapping from merge field display names (e.g. "Vorname") to
    // the Mailchimp tag (e.g. "MMERGE1") so that contacts fetched from
    // Mailchimp whose merge_fields are keyed by name get normalised to the
    // tag-keyed form expected by the sync config before comparison.
    const mergeFieldAliasMap = await this.buildMergeFieldAliasMap(
      config.mailchimp_listId
    );

    let mailchimpContactMap: Map<string, any>;
    if (useTargetedContactFetch) {
      const candidateEmails: string[] = [];
      for (const userWithSub of usersWithSubscriptions) {
        if (!userWithSub.user.email) continue;
        if (recentErrorUserIds.has(userWithSub.user.id)) continue;
        candidateEmails.push(userWithSub.user.email.toLowerCase());
        if (candidateEmails.length >= limit) break;
      }
      mailchimpContactMap = await this.fetchMailchimpContactsByEmail(
        config.mailchimp_listId,
        candidateEmails
      );
    } else {
      const mailchimpContacts = await this.getMailchimpContacts(
        config.mailchimp_listId
      );
      mailchimpContactMap = new Map(
        mailchimpContacts.map(m => [m.email_address?.toLowerCase(), m])
      );
    }

    // Normalise merge field keys in all fetched contacts: any key that
    // matches a known display name is remapped to its tag so the
    // comparison against the config's tag-keyed mergeFields works.
    if (mergeFieldAliasMap.size > 0) {
      for (const contact of mailchimpContactMap.values()) {
        if (contact.merge_fields) {
          contact.merge_fields = this.normalizeMergeFields(
            contact.merge_fields,
            mergeFieldAliasMap
          );
        }
      }
    }

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let processedCount = 0;
    const changes: DryRunChange[] = [];

    // Update progress total if tracking
    const progress = MailchimpSyncService.syncProgress.get(config.id);
    if (progress) {
      progress.total = usersWithSubscriptions.length;
    }

    // Phase 1: Prepare all updates (CPU-only, no API calls)
    interface PendingUpdate {
      userId: string;
      email: string;
      mergeFields: Record<string, string>;
      interests: Record<string, boolean>;
      isNew: boolean;
      existingContact: any;
    }

    const pendingUpdates: PendingUpdate[] = [];

    for (const userWithSub of usersWithSubscriptions) {
      if (!userWithSub.user.email) continue;
      if (limit && processedCount >= limit) break;

      if (recentErrorUserIds.has(userWithSub.user.id)) {
        skippedCount++;
        continue;
      }

      processedCount++;

      const existingContact = mailchimpContactMap.get(
        userWithSub.user.email.toLowerCase()
      );

      // Skip existing contacts that aren't subscribed (unsubscribed, cleaned,
      // pending, transactional). New users are created as 'subscribed'.
      if (existingContact && existingContact.status !== 'subscribed') {
        skippedCount++;
        continue;
      }

      const mergeFields: Record<string, string> = {};
      for (const mapping of mergeFieldMappings) {
        const value = this.evaluateMergeFieldExpression(
          mapping.expression,
          userWithSub
        );
        if (value !== '') {
          mergeFields[mapping.tag] = value;
        }
      }

      const interests: Record<string, boolean> = {};

      // Preserve existing Mailchimp values by default — the sync should
      // never clobber interest groups it doesn't manage.
      if (existingContact?.interests) {
        for (const [groupId, value] of Object.entries(
          existingContact.interests
        )) {
          interests[groupId] = value as boolean;
        }
      }

      // Default interest groups are only applied when first creating the
      // contact. For existing contacts we preserve whatever Mailchimp has so
      // manual unsubscribes aren't clobbered on every sync.
      if (!existingContact) {
        for (const groupId of defaultInterestGroupIds) {
          interests[groupId] = true;
        }
      }

      // For each mapped interest group: only flip to true when a genuinely
      // new matching subscription starts, and only flip to false when all
      // matching subs are definitively ended. Otherwise preserve the
      // existing value (from Mailchimp or false for new contacts).
      for (const mapping of interestGroupMappings) {
        if (defaultInterestGroupIds.includes(mapping.groupId)) continue;
        const currentValue = interests[mapping.groupId] ?? false;
        interests[mapping.groupId] = this.determineInterestValue(
          mapping,
          userWithSub.subscriptions,
          currentValue
        );
      }

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
        updatedCount++;
      } else {
        pendingUpdates.push({
          userId: userWithSub.user.id,
          email: userWithSub.user.email,
          mergeFields,
          interests,
          isNew: !existingContact,
          existingContact,
        });
      }

      if (processedCount % 100 === 0) {
        this.updateProgress(config.id, {
          processed: processedCount,
          updated: updatedCount,
          skipped: skippedCount,
          errors: errorCount,
        });
      }
    }

    this.updateProgress(config.id, {
      processed: processedCount,
      updated: updatedCount,
      skipped: skippedCount,
      errors: errorCount,
    });

    // Phase 2: Send updates via Mailchimp Batch API
    if (pendingUpdates.length > 0) {
      const BATCH_SIZE = 500; // Mailchimp recommends max 500 operations per batch

      for (let i = 0; i < pendingUpdates.length; i += BATCH_SIZE) {
        const batch = pendingUpdates.slice(i, i + BATCH_SIZE);

        const operations = batch.map(update => {
          const email = update.email.trim().toLowerCase();
          const subscriberHash = createHash('md5').update(email).digest('hex');

          return {
            method: 'PUT' as const,
            path: `/lists/${config.mailchimp_listId}/members/${subscriberHash}`,
            body: JSON.stringify({
              email_address: update.email.trim(),
              status_if_new: 'subscribed',
              merge_fields: update.mergeFields,
              interests: update.interests,
            }),
          };
        });

        try {
          const batchResponse = (await (mailchimp as any).batches.start({
            operations,
          })) as any;

          // Poll for batch completion
          const batchId = batchResponse.id;
          let batchStatus = batchResponse.status;

          while (batchStatus !== 'finished') {
            await new Promise(resolve => setTimeout(resolve, 3000));
            const statusResponse = (await (mailchimp as any).batches.status(
              batchId
            )) as any;
            batchStatus = statusResponse.status;

            // Update progress based on batch stats
            this.updateProgress(config.id, {
              processed: processedCount,
              updated:
                updatedCount +
                (statusResponse.finished_operations ?? 0) -
                (statusResponse.errored_operations ?? 0),
              skipped: skippedCount,
              errors: errorCount + (statusResponse.errored_operations ?? 0),
            });

            if (batchStatus === 'errored' || batchStatus === 'canceled') {
              break;
            }
          }

          // Final counts from this batch
          const finalStatus = (await (mailchimp as any).batches.status(
            batchId
          )) as any;
          const batchErrors = finalStatus.errored_operations ?? 0;
          const batchSuccess = batch.length - batchErrors;

          if (batchErrors === 0) {
            updatedCount += batchSuccess;
          } else {
            // Re-try individually to identify which contacts failed
            this.logger.warn(
              `Batch ${batchId}: ${batchErrors} errors, retrying individually to identify failures`
            );
            for (const update of batch) {
              try {
                await this.upsertMailchimpContact(config.mailchimp_listId!, {
                  email: update.email,
                  mergeFields: update.mergeFields,
                  interests: update.interests,
                });
                updatedCount++;
              } catch (error: any) {
                const errorMessage =
                  error instanceof Error ? error.message : String(error);
                const statusCode =
                  error?.response?.body?.status ?? error?.status ?? null;
                this.logger.warn(
                  `Failed to update contact '${update.email}': ${errorMessage}`
                );
                await this.recordSyncError(
                  config.id,
                  update.userId,
                  update.email,
                  errorMessage,
                  statusCode
                );
                errorCount++;
              }
            }
          }
        } catch (error: any) {
          // Batch API itself failed — fall back to recording errors for all contacts in batch
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.logger.error(`Batch API failed: ${errorMessage}`);

          for (const update of batch) {
            await this.recordSyncError(
              config.id,
              update.userId,
              update.email,
              `Batch failed: ${errorMessage}`,
              null
            );
          }
          errorCount += batch.length;
        }

        this.updateProgress(config.id, {
          processed: processedCount,
          updated: updatedCount,
          skipped: skippedCount,
          errors: errorCount,
        });
      }
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

    await this.runExtensions(config);

    return null;
  }

  private async runExtensions(
    config: SettingSyncProvider & { decryptedApiKey: string | null }
  ): Promise<void> {
    const extensions = (config.mailchimp_extensions ?? {}) as Record<
      string,
      { enabled?: boolean; config?: Record<string, any> } | undefined
    >;

    const clickTracking = extensions[CLICK_TRACKING_EXTENSION_TYPE];
    if (clickTracking?.enabled && config.mailchimp_listId) {
      try {
        await this.clickTrackingExtension.execute(
          config.mailchimp_listId,
          (clickTracking.config ?? {}) as ClickTrackingExtensionConfig
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Click tracking extension failed for "${config.name || config.id}": ${errorMessage}`
        );
      }
    }
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

    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        confirmed: true,
      },
      select: {
        id: true,
        userID: true,
        paidUntil: true,
        startsAt: true,
        autoRenew: true,
        memberPlan: {
          select: { slug: true },
        },
        paymentMethod: {
          select: { slug: true },
        },
        deactivation: {
          select: { id: true },
        },
        replacesSubscriptionID: true,
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

      // currentSubscription = any subscription without a deactivation record.
      // paidUntil in the past is fine (grace period / pending renewal) — the
      // subscription is considered active until it's formally deactivated.
      const currentSubscription = userSubs
        .filter(
          s => !s.deactivation || (s.paidUntil && s.paidUntil > new Date())
        )
        .sort(
          (a, b) =>
            (b.paidUntil?.getTime() ?? 0) - (a.paidUntil?.getTime() ?? 0)
        )[0];

      // lastSubscription and subscriptions include deactivated subs so
      // expressions like active_abo (-1) and retarget:days flag churned
      // users, not just those in a silent grace period.
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
    let hasMore = true;

    while (hasMore) {
      let response: any;
      try {
        response = await mailchimp.lists.getListMembersInfo(listId, {
          offset,
          count: batchSize,
          fields: [
            'members.email_address',
            'members.merge_fields',
            'members.interests',
            'members.status',
            'total_items',
          ],
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
        hasMore = false;
      } else {
        offset += batchSize;
      }
    }

    return allMembers;
  }

  private async fetchMailchimpContactsByEmail(
    listId: string,
    emails: string[]
  ): Promise<Map<string, any>> {
    // Mailchimp allows ~10 concurrent connections per account.
    const CONCURRENCY = 10;
    const map = new Map<string, any>();

    for (let i = 0; i < emails.length; i += CONCURRENCY) {
      const chunk = emails.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        chunk.map(async email => {
          const normalized = email.trim().toLowerCase();
          const subscriberHash = createHash('md5')
            .update(normalized)
            .digest('hex');

          try {
            const member = await mailchimp.lists.getListMember(
              listId,
              subscriberHash
            );
            return { email: normalized, member };
          } catch (error: any) {
            const status = error?.response?.body?.status ?? error?.status;
            if (status === 404) {
              return { email: normalized, member: null };
            }
            const detail =
              error?.response?.body?.detail ?? error?.message ?? String(error);
            const title = error?.response?.body?.title ?? 'Mailchimp API error';
            throw new Error(`${title} (${status}): ${detail}`);
          }
        })
      );

      for (const { email, member } of results) {
        if (member) map.set(email, member);
      }
    }

    return map;
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
   * - "user.firstName" / "user.name" / "user.id" - direct user field access
   * - "slug:contains:value" / "slug:contains_any:v1,v2" / "slug:equals:value"
   *     "1" if current subscription plan slug matches, "-1" if only past
   *     subscriptions match, "" if no matching sub ever.
   * - "active_abo" - "1" if active, "-1" if past subscriptions, "" if none
   * - "active_abo_with_payment:method_slug:days" - like active_abo but also returns "1"
   *     if last subscription has given payment method and paidUntil within N days
   * - "retarget:days" - "1" if last subscription paidUntil within N days, "-1" if currently subscribed but was previously retargetable, else ""
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
        if (result !== '') return result;
      }
      return '';
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
        return (data.user.firstName || 'Unbekannt').trim();

      case 'user.name':
        return (data.user.name || 'Unbekannt').trim();

      case 'user.id':
        return data.user.id;

      case 'slug': {
        const op = parts[1];
        const value = parts.slice(2).join(':');

        const matches = (slug: string | undefined): boolean => {
          if (!slug) return false;
          if (op === 'equals') return slug === value;
          if (op === 'contains') return slug.includes(value);
          if (op === 'contains_any') {
            return value.split(',').some(v => slug.includes(v.trim()));
          }
          return false;
        };

        const now = new Date();
        const matchingSubs = data.subscriptions.filter(s =>
          matches(s.memberPlan.slug)
        );
        if (matchingSubs.some(s => this.isSubscriptionActive(s, now))) {
          return '1';
        }
        if (matchingSubs.length > 0) {
          return '-1';
        }
        return '';
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
        if (data.currentSubscription) {
          const hasPastSubscriptions = data.subscriptions.some(
            s => s !== data.currentSubscription
          );
          return hasPastSubscriptions ? '-1' : '';
        }
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
   * Check whether a single subscription matches an interest group expression.
   * Supported formats:
   * - "slug:equals:value"
   * - "slug:contains:value"
   * - "slug:contains_any:val1,val2"
   */
  private subscriptionMatchesInterestExpression(
    expression: string,
    subscription: SubscriptionLite
  ): boolean {
    const parts = expression.split(':');
    if (parts[0] !== 'slug') return false;

    const op = parts[1];
    const value = parts.slice(2).join(':');
    const slug = subscription.memberPlan.slug;

    if (op === 'equals') return slug === value;
    if (op === 'contains') return slug.includes(value);
    if (op === 'contains_any') {
      return value.split(',').some(v => slug.includes(v.trim()));
    }
    return false;
  }

  private determineInterestValue(
    mapping: InterestGroupMapping,
    subscriptions: SubscriptionLite[],
    currentValue: boolean
  ): boolean {
    const now = new Date();
    const matchingSubs = subscriptions.filter(sub =>
      this.subscriptionMatchesInterestExpression(mapping.expression, sub)
    );

    if (matchingSubs.length === 0) return currentValue;

    const activeSubs = matchingSubs.filter(sub =>
      this.isSubscriptionActive(sub, now)
    );
    const hasActive = activeSubs.length > 0;

    if (hasActive) {
      const newestActive = activeSubs[0];
      if (
        !currentValue &&
        now.getTime() - newestActive.startsAt.getTime() <=
          NEW_SUBSCRIPTION_WINDOW_MS &&
        !this.isRenewal(newestActive, matchingSubs, now)
      ) {
        return true;
      }
      return currentValue;
    }

    if (currentValue && this.isDefinitivelyEnded(matchingSubs, now)) {
      return false;
    }

    return currentValue;
  }

  private isSubscriptionActive(sub: SubscriptionLite, now: Date): boolean {
    if (sub.deactivation && (!sub.paidUntil || sub.paidUntil <= now))
      return false;
    if (!sub.paidUntil) return true;
    if (sub.paidUntil > now) return true;
    return now.getTime() - sub.paidUntil.getTime() <= GRACE_PERIOD_MS;
  }

  private isRenewal(
    sub: SubscriptionLite,
    matchingSubs: SubscriptionLite[],
    now: Date
  ): boolean {
    if (sub.replacesSubscriptionID) {
      return matchingSubs.some(s => s.id === sub.replacesSubscriptionID);
    }

    const predecessor = matchingSubs.find(
      s =>
        s.id !== sub.id &&
        !s.deactivation &&
        s.autoRenew &&
        !!s.paidUntil &&
        s.paidUntil <= now &&
        sub.startsAt.getTime() >= s.paidUntil.getTime() &&
        sub.startsAt.getTime() - s.paidUntil.getTime() <= RENEWAL_PROXIMITY_MS
    );

    return !!predecessor;
  }

  private isDefinitivelyEnded(
    subscriptions: SubscriptionLite[],
    now: Date
  ): boolean {
    return subscriptions.some(sub => {
      const paidUntilElapsed = !sub.paidUntil || sub.paidUntil <= now;
      const withinGracePeriod =
        !!sub.paidUntil &&
        now.getTime() - sub.paidUntil.getTime() <= GRACE_PERIOD_MS;
      return (
        sub.deactivation ||
        !sub.autoRenew ||
        (paidUntilElapsed && !withinGracePeriod)
      );
    });
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
   *
   * Mailchimp coerces values based on the merge field Type: writing "0" to a
   * NUMBER-typed field is echoed back as 0, so compare via string coercion
   * and treat null/undefined/"" as equivalent.
   */
  private hasDesiredValues(existing: any, desired: any): boolean {
    if (!existing || !desired) return false;
    for (const key of Object.keys(desired)) {
      if (!this.valuesEquivalent(existing[key], desired[key])) return false;
    }
    return true;
  }

  private async buildMergeFieldAliasMap(
    listId: string
  ): Promise<Map<string, string>> {
    // Maps the field's display name (e.g. "Vorname") to the Mailchimp API
    // tag (e.g. "MMERGE1"). Used to normalise contact merge_fields whose
    // keys arrive as names instead of tags so they line up with the
    // tag-keyed config mappings before comparison.
    const aliasMap = new Map<string, string>();
    try {
      const response = (await mailchimp.lists.getListMergeFields(listId, {
        count: 100,
      })) as any;
      for (const field of response.merge_fields ?? []) {
        if (field.tag && field.name && field.tag !== field.name) {
          aliasMap.set(field.name, field.tag);
        }
      }
    } catch {
      // Proceed without normalisation if the API call fails
    }
    return aliasMap;
  }

  private normalizeMergeFields(
    mergeFields: Record<string, any>,
    aliasMap: Map<string, string>
  ): Record<string, any> {
    const normalized: Record<string, any> = {};
    for (const [key, value] of Object.entries(mergeFields)) {
      normalized[aliasMap.get(key) ?? key] = value;
    }
    return normalized;
  }

  private valuesEquivalent(a: any, b: any): boolean {
    if (a === b) return true;

    const aEmpty = a == null || a === '';
    const bEmpty = b == null || b === '';
    if (aEmpty && bEmpty) return true;
    if (aEmpty !== bEmpty) return false;

    // For number fields, "0" and "" are equivalent (both represent empty)
    if ((a === '0' || a === 0) && b === '') return true;
    if ((b === '0' || b === 0) && a === '') return true;

    if (typeof a === 'object' || typeof b === 'object') {
      return JSON.stringify(a) === JSON.stringify(b);
    }

    return String(a).trim() === String(b).trim();
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

  private updateProgress(
    configId: string,
    counts: Pick<SyncProgress, 'processed' | 'updated' | 'skipped' | 'errors'>
  ): void {
    const progress = MailchimpSyncService.syncProgress.get(configId);
    if (progress) {
      Object.assign(progress, counts);
    }
  }
}
