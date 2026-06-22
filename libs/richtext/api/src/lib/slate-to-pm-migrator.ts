import { Injectable, Logger } from '@nestjs/common';
import { RichtextElements, RichtextJSONDocument } from '@wepublish/richtext';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { Prisma, PrismaClient } from '@prisma/client';

// Slate keeps a node's visible text in `text`, or nested in `children`.
const slateText = (node: any): string => {
  if (typeof node?.text === 'string') {
    return node.text;
  }

  return (node?.children ?? []).map(slateText).join('');
};

const slateToPm = (content: any): RichtextElements | [] => {
  const children = (content.children ?? []).flatMap(
    (child: any): RichtextElements | [] => {
      // Treat links as if they don't have a type
      if (child.type && child.type !== 'link') {
        return slateToPm(child);
      }

      const isLink = 'type' in child && child.type === 'link';

      // Links carry their label in `children`, not `title`; fall back to the url.
      const text =
        isLink ?
          slateText(child) || child.title || child.url || ''
        : child.text;

      // ProseMirror rejects text nodes whose `text` is not a non-empty string
      // (RangeError: Invalid text node in JSON / empty text nodes not allowed).
      if (typeof text !== 'string' || text.length === 0) {
        return [];
      }

      // No type (or link type) = text node
      return {
        type: 'text',
        attrs: undefined,
        text,
        marks: [
          isLink ?
            {
              type: 'link',
              attrs: {
                href: child.url,
                // @TODO: target?
                rel: 'noopener noreferrer nofollow',
                class: null,
              },
            }
          : [],
          child.italic ? { type: 'italic' } : [],
          child.bold ? { type: 'bold' } : [],
          child.underline ? { type: 'underline' } : [],
          child.strikethrough ? { type: 'strike' } : [],
          child.subscript ? { type: 'subscript' } : [],
          child.superscript ? { type: 'superscript' } : [],
        ].flat(),
      };
    }
  );

  if (content.type === 'heading-one') {
    return {
      type: 'heading',
      attrs: {
        level: 3,
      },
      content: children,
    };
  }

  if (content.type === 'heading-two') {
    return {
      type: 'heading',
      attrs: {
        level: 4,
      },
      content: children,
    };
  }

  if (content.type === 'heading-three') {
    return {
      type: 'heading',
      attrs: {
        level: 5,
      },
      content: children,
    };
  }

  if (content.type === 'paragraph') {
    return {
      type: 'paragraph',
      attrs: {
        textAlign: 'left',
      },
      content: children,
    };
  }

  if (content.type === 'table') {
    return {
      type: 'table',
      attrs: undefined,
      content: children,
    };
  }

  if (content.type === 'table-row') {
    return {
      type: 'tableRow',
      attrs: undefined,
      content: children,
    };
  }

  if (content.type === 'table-cell') {
    return {
      type: 'tableCell',
      attrs: {
        borderColor: content.borderColor,
        colwidth: null,
        colspan: 1,
        rowspan: 1,
      },
      content: children,
    };
  }

  if (content.type === 'unordered-list') {
    return {
      type: 'bulletList',
      attrs: undefined,
      content: children,
    };
  }

  if (content.type === 'ordered-list') {
    return {
      type: 'orderedList',
      attrs: {
        start: 1,
        type: null,
      },
      content: children,
    };
  }

  if (content.type === 'list-item') {
    return {
      type: 'listItem',
      attrs: undefined,
      content: children,
    };
  }

  return [];
};

@Injectable()
export class SlateToPmMigrator {
  private readonly logger = new Logger(SlateToPmMigrator.name);

  constructor(
    private prisma: PrismaClient,
    private schedulerRegistry: SchedulerRegistry
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS, {
    name: 'slate.migrateAuthors',
    waitForCompletion: true,
  })
  async migrateAuthors() {
    const authors = await this.prisma.author.findMany({
      where: {
        slateBio: {
          not: Prisma.AnyNull,
        },
        bio: {
          equals: Prisma.AnyNull,
        },
      },
      take: 30,
    });

    await Promise.all(
      authors.map(async author => {
        this.logger.log(`Migrating author with id: ${author.id}`);
        await this.prisma.author.update({
          where: { id: author.id },
          // @ts-expect-error Prisma JSON typings
          data: { bio: this.migrate(author.slateBio ?? []) },
        });
      })
    );

    if (authors.length < 30) {
      this.schedulerRegistry.deleteCronJob('slate.migrateAuthors');
      this.logger.warn(
        'Stopped `slate.migrateAuthors` cronjob as all have been migrated'
      );
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS, {
    name: 'slate.migrateComments',
    waitForCompletion: true,
  })
  async migrateComments() {
    const revisions = await this.prisma.commentsRevisions.findMany({
      where: {
        slateText: {
          not: Prisma.AnyNull,
        },
        text: {
          equals: Prisma.AnyNull,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });

    await Promise.all(
      revisions.map(async revision => {
        this.logger.log(`Migrating comment revision with id: ${revision.id}`);
        await this.prisma.commentsRevisions.update({
          where: { id: revision.id },
          // @ts-expect-error Prisma JSON typings
          data: { text: this.migrate(revision.slateText ?? []) },
        });
      })
    );

    if (revisions.length < 300) {
      this.schedulerRegistry.deleteCronJob('slate.migrateComments');
      this.logger.warn(
        'Stopped `slate.migrateComments` cronjob as all have been migrated'
      );
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS, {
    name: 'slate.migrateEvents',
    waitForCompletion: true,
  })
  async migrateEvents() {
    const events = await this.prisma.event.findMany({
      where: {
        slateDescription: {
          not: Prisma.AnyNull,
        },
        description: {
          equals: Prisma.AnyNull,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    await Promise.all(
      events.map(async event => {
        this.logger.log(`Migrating event with id: ${event.id}`);
        await this.prisma.event.update({
          where: { id: event.id },
          // @ts-expect-error Prisma JSON typings
          data: { description: this.migrate(event.slateDescription ?? []) },
        });
      })
    );

    if (events.length < 30) {
      this.schedulerRegistry.deleteCronJob('slate.migrateEvents');
      this.logger.warn(
        'Stopped `slate.migrateEvents` cronjob as all have been migrated'
      );
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS, {
    name: 'slate.migratePeerProfiles',
    waitForCompletion: true,
  })
  async migratePeerProfiles() {
    const peerProfiles = await this.prisma.peerProfile.findMany({
      where: {
        slateCallToActionText: {
          not: Prisma.AnyNull,
        },
        callToActionText: {
          equals: Prisma.AnyNull,
        },
      },
      take: 30,
    });

    await Promise.all(
      peerProfiles.map(async peerProfile => {
        this.logger.log(`Migrating peerProfile with id: ${peerProfile.id}`);
        await this.prisma.peerProfile.update({
          where: { id: peerProfile.id },
          data: {
            callToActionText: this.migrate(
              // @ts-expect-error Prisma JSON typings
              peerProfile.slateCallToActionText ?? []
            ),
          },
        });
      })
    );

    if (peerProfiles.length < 30) {
      this.schedulerRegistry.deleteCronJob('slate.migratePeerProfiles');
      this.logger.warn(
        'Stopped `slate.migratePeerProfiles` cronjob as all have been migrated'
      );
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS, {
    name: 'slate.migratePeers',
    waitForCompletion: true,
  })
  async migratePeers() {
    const peers = await this.prisma.peer.findMany({
      where: {
        slateInformation: {
          not: Prisma.AnyNull,
        },
        information: {
          equals: Prisma.AnyNull,
        },
      },
      take: 30,
    });

    await Promise.all(
      peers.map(async peer => {
        this.logger.log(`Migrating peer with id: ${peer.id}`);
        await this.prisma.peer.update({
          where: { id: peer.id },
          data: {
            // @ts-expect-error Prisma JSON typings
            information: this.migrate(peer.slateInformation ?? []),
          },
        });
      })
    );

    if (peers.length < 30) {
      this.schedulerRegistry.deleteCronJob('slate.migratePeers');
      this.logger.warn(
        'Stopped `slate.migratePeers` cronjob as all have been migrated'
      );
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS, {
    name: 'slate.migratePolls',
    waitForCompletion: true,
  })
  async migratePolls() {
    const polls = await this.prisma.poll.findMany({
      where: {
        slateInfoText: {
          not: Prisma.AnyNull,
        },
        infoText: {
          equals: Prisma.AnyNull,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    await Promise.all(
      polls.map(async poll => {
        this.logger.log(`Migrating poll with id: ${poll.id}`);
        await this.prisma.poll.update({
          where: { id: poll.id },
          data: {
            // @ts-expect-error Prisma JSON typings
            infoText: this.migrate(poll.slateInfoText ?? []),
          },
        });
      })
    );

    if (polls.length < 30) {
      this.schedulerRegistry.deleteCronJob('slate.migratePolls');
      this.logger.warn(
        'Stopped `slate.migratePolls` cronjob as all have been migrated'
      );
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS, {
    name: 'slate.migrateTags',
    waitForCompletion: true,
  })
  async migrateTags() {
    const tags = await this.prisma.tag.findMany({
      where: {
        slateDescription: {
          not: Prisma.AnyNull,
        },
        description: {
          equals: Prisma.AnyNull,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    await Promise.all(
      tags.map(async tag => {
        this.logger.log(`Migrating tag with id: ${tag.id}`);
        await this.prisma.tag.update({
          where: { id: tag.id },
          data: {
            // @ts-expect-error Prisma JSON typings
            description: this.migrate(tag.slateDescription ?? []),
          },
        });
      })
    );

    if (tags.length < 30) {
      this.schedulerRegistry.deleteCronJob('slate.migrateTags');
      this.logger.warn(
        'Stopped `slate.migrateTags` cronjob as all have been migrated'
      );
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS, {
    name: 'slate.migrateMemberPlans',
    waitForCompletion: true,
  })
  async migrateMemberPlans() {
    const memberPlansByDescription = await this.prisma.memberPlan.findMany({
      where: {
        slateDescription: {
          not: Prisma.AnyNull,
        },
        description: {
          equals: Prisma.AnyNull,
        },
      },
      take: 30,
    });

    const memberPlansByShortDescription = await this.prisma.memberPlan.findMany(
      {
        where: {
          slateShortDescription: {
            not: Prisma.AnyNull,
          },
          shortDescription: {
            equals: Prisma.AnyNull,
          },
        },
        take: 30,
      }
    );

    await Promise.all([
      ...memberPlansByDescription.map(async memberPlan => {
        this.logger.log(`Migrating memberPlan with id: ${memberPlan.id}`);
        await this.prisma.memberPlan.update({
          where: { id: memberPlan.id },
          data: {
            // @ts-expect-error Prisma JSON typings
            description: this.migrate(memberPlan.slateDescription ?? []),
          },
        });
      }),
      ...memberPlansByShortDescription.map(async memberPlan => {
        this.logger.log(`Migrating memberPlan with id: ${memberPlan.id}`);
        await this.prisma.memberPlan.update({
          where: { id: memberPlan.id },
          data: {
            shortDescription: this.migrate(
              // @ts-expect-error Prisma JSON typings
              memberPlan.slateShortDescription ?? []
            ),
          },
        });
      }),
    ]);

    if (
      memberPlansByDescription.length < 30 &&
      memberPlansByShortDescription.length < 30
    ) {
      this.schedulerRegistry.deleteCronJob('slate.migrateMemberPlans');
      this.logger.warn(
        'Stopped `slate.migrateMemberPlans` cronjob as all have been migrated'
      );
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS, {
    name: 'slate.migratePaywalls',
    waitForCompletion: true,
  })
  async migratePaywalls() {
    const paywallsByDescription = await this.prisma.paywall.findMany({
      where: {
        slateDescription: {
          not: Prisma.AnyNull,
        },
        description: {
          equals: Prisma.AnyNull,
        },
      },
      take: 30,
    });

    const paywallsByUpgradeDescription = await this.prisma.paywall.findMany({
      where: {
        slateUpgradeDescription: {
          not: Prisma.AnyNull,
        },
        upgradeDescription: {
          equals: Prisma.AnyNull,
        },
      },
      take: 30,
    });

    const paywallsByCircumventDescription = await this.prisma.paywall.findMany({
      where: {
        slateCircumventDescription: {
          not: Prisma.AnyNull,
        },
        circumventDescription: {
          equals: Prisma.AnyNull,
        },
      },
      take: 30,
    });

    const paywallsByUpgradeCircumventDescription =
      await this.prisma.paywall.findMany({
        where: {
          slateUpgradeCircumventDescription: {
            not: Prisma.AnyNull,
          },
          upgradeCircumventDescription: {
            equals: Prisma.AnyNull,
          },
        },
        take: 30,
      });

    await Promise.all([
      ...paywallsByDescription.map(async paywall => {
        this.logger.log(`Migrating paywall with id: ${paywall.id}`);
        await this.prisma.paywall.update({
          where: { id: paywall.id },
          data: {
            // @ts-expect-error Prisma JSON typings
            description: this.migrate(paywall.slateDescription ?? []),
          },
        });
      }),
      ...paywallsByUpgradeDescription.map(async paywall => {
        this.logger.log(`Migrating paywall with id: ${paywall.id}`);
        await this.prisma.paywall.update({
          where: { id: paywall.id },
          data: {
            upgradeDescription: this.migrate(
              // @ts-expect-error Prisma JSON typings
              paywall.slateUpgradeDescription ?? []
            ),
          },
        });
      }),
      ...paywallsByCircumventDescription.map(async paywall => {
        this.logger.log(`Migrating paywall with id: ${paywall.id}`);
        await this.prisma.paywall.update({
          where: { id: paywall.id },
          data: {
            circumventDescription: this.migrate(
              // @ts-expect-error Prisma JSON typings
              paywall.slateCircumventDescription ?? []
            ),
          },
        });
      }),
      ...paywallsByUpgradeCircumventDescription.map(async paywall => {
        this.logger.log(`Migrating paywall with id: ${paywall.id}`);
        await this.prisma.paywall.update({
          where: { id: paywall.id },
          data: {
            upgradeCircumventDescription: this.migrate(
              // @ts-expect-error Prisma JSON typings
              paywall.slateUpgradeCircumventDescription ?? []
            ),
          },
        });
      }),
    ]);

    if (
      paywallsByDescription.length < 30 &&
      paywallsByUpgradeDescription.length < 30 &&
      paywallsByCircumventDescription.length < 30 &&
      paywallsByUpgradeCircumventDescription.length < 30
    ) {
      this.schedulerRegistry.deleteCronJob('slate.migratePaywalls');
      this.logger.warn(
        'Stopped `slate.migratePaywalls` cronjob as all have been migrated'
      );
    }
  }

  @Cron(CronExpression.EVERY_5_SECONDS, {
    name: 'slate.migrateArticles',
    waitForCompletion: true,
  })
  async migrateArticles() {
    const revisionIds: { id: string }[] = await this.prisma.$queryRaw`
        SELECT id from "articles.revisions" WHERE blocks::text LIKE '%"richText": null%' OR blocks::text LIKE '%"richText":null%';
    `;

    const revisions = await this.prisma.articleRevision.findMany({
      where: {
        id: {
          in: revisionIds.map(({ id }) => id),
        },
      },
      orderBy: [
        { createdAt: 'desc' },
        {
          archivedAt: 'desc',
        },
        {
          publishedAt: 'asc',
        },
      ],
      take: 300,
    });

    await Promise.all(
      revisions.map(async revision => {
        this.logger.log(`Migrating articleRevision with id: ${revision.id}`);

        if (!Array.isArray(revision.blocks)) {
          throw new Error(
            `Unable to migrate articleRevision with id ${revision.id}`
          );
        }

        const updatedBlocks = revision.blocks.map((block: any) => {
          if (['richText', 'linkPageBreak'].includes(block.type)) {
            return {
              ...block,
              richText: this.migrate(block.slateRichText ?? []),
            };
          }

          if (['listicle'].includes(block.type)) {
            return {
              ...block,
              items: block.items.map((item: any) => ({
                ...item,
                richText: this.migrate(item.slateRichText ?? []),
              })),
            };
          }

          return block;
        });

        await this.prisma.articleRevision.update({
          where: { id: revision.id },
          data: { blocks: updatedBlocks },
        });
      })
    );

    if (revisions.length < 300) {
      this.schedulerRegistry.deleteCronJob('slate.migrateArticles');
      this.logger.warn(
        'Stopped `slate.migrateArticles` cronjob as all have been migrated'
      );
    }
  }

  @Cron(CronExpression.EVERY_5_SECONDS, {
    name: 'slate.migratePages',
    waitForCompletion: true,
  })
  async migratePages() {
    const revisionIds: { id: string }[] = await this.prisma.$queryRaw`
        SELECT id from "pages.revisions" WHERE blocks::text LIKE '%"richText": null%' OR blocks::text LIKE '%"richText":null%';
    `;

    const revisions = await this.prisma.pageRevision.findMany({
      where: {
        id: {
          in: revisionIds.map(({ id }) => id),
        },
      },
      orderBy: [
        { createdAt: 'desc' },
        {
          archivedAt: 'desc',
        },
        {
          publishedAt: 'asc',
        },
      ],
      take: 300,
    });

    await Promise.all(
      revisions.map(async revision => {
        this.logger.log(`Migrating pageRevision with id: ${revision.id}`);

        if (!Array.isArray(revision.blocks)) {
          throw new Error(
            `Unable to migrate pageRevision with id ${revision.id}`
          );
        }

        const updatedBlocks = revision.blocks.map((block: any) => {
          if (['richText', 'linkPageBreak'].includes(block.type)) {
            return {
              ...block,
              richText: this.migrate(block.slateRichText ?? []),
            };
          }

          if (['listicle'].includes(block.type)) {
            return {
              ...block,
              items: block.items.map((item: any) => ({
                ...item,
                richText: this.migrate(item.slateRichText ?? []),
              })),
            };
          }

          return block;
        });

        await this.prisma.pageRevision.update({
          where: { id: revision.id },
          data: { blocks: updatedBlocks },
        });
      })
    );

    if (revisions.length < 300) {
      this.schedulerRegistry.deleteCronJob('slate.migratePages');
      this.logger.warn(
        'Stopped `slate.migratePages` cronjob as all have been migrated'
      );
    }
  }

  migrate(slate: Array<any>): RichtextJSONDocument {
    const result = {
      type: 'doc',
      attrs: undefined,
      content: slate.flatMap(slateToPm),
    } satisfies RichtextJSONDocument;

    this.logger.debug(`Previous: ${JSON.stringify(slate)}`);
    this.logger.debug(`Next: ${JSON.stringify(result)}`);

    return result;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEMPORARY richtext RE-MIGRATION — runs AUTOMATICALLY on deploy (no env flag).
  //
  // The original slate→tiptap migration ran with a buggy `slateToPm` (links lost
  // their label → text nodes with no `text` ⇒ invalid ProseMirror documents: the
  // website tolerates them, the editor throws `Invalid text node in JSON`). The
  // normal migrate* crons above only touch `richText: null`, so they never re-fix
  // already-migrated content. These passes do, by re-running the now-fixed
  // transform from the preserved slate.
  //
  // Safe to leave running unattended: each pass uses a self-emptying jsonpath
  // predicate, then `deleteCronJob`s itself once nothing matches (or if a pass
  // makes no progress — the loop guard, since there is no env kill-switch). It is
  // idempotent, only ever rewrites `richText`/`slateRichText` (never `properties`,
  // so importer archive-id resume stays intact), and only touches BUGGY blocks —
  // clean blocks may have been edited in the editor and must NOT be reverted to
  // their stale `slateRichText`. After the DB is clean it is inert (one 0-row scan
  // per boot, then self-deletes); remove the code at leisure in a follow-up.
  //
  //   remigrateBuggy*          GENERAL — any app that ran the original migration
  //                            has this bug; safe to keep / upstream.
  //   remigrateEenewsRawSlate  EENEWS-ONLY · TEMPORARY — delete after the eenews
  //                            import cleanup (see below).
  // ───────────────────────────────────────────────────────────────────────────

  // A text node whose `text` is missing or empty — the signature of the buggy
  // migration. Recursive; key-order/whitespace independent (jsonb re-serializes).
  private static readonly BUGGY_TEXT_NODE =
    '$.** ? (@.type == "text" && (!exists(@.text) || @.text == ""))';

  private static readonly RAW_SLATE_RICHTEXT =
    '$.** ? (@.richText.type() == "array")';

  private stopCron(name: string, reason: string): void {
    try {
      this.schedulerRegistry.deleteCronJob(name);
    } catch {
      // not registered / already removed
    }
    this.logger.warn(`Stopped \`${name}\` — ${reason}`);
  }

  // True when `doc` contains a text node the editor would reject (no/empty text).
  private hasBuggyTextNode(doc: any): boolean {
    if (!doc || typeof doc !== 'object') {
      return false;
    }
    if (
      doc.type === 'text' &&
      (typeof doc.text !== 'string' || doc.text.length === 0)
    ) {
      return true;
    }
    return Array.isArray(doc.content) ?
        doc.content.some((child: any) => this.hasBuggyTextNode(child))
      : false;
  }

  // GENERAL: re-migrate ONLY buggy blocks that still have a real slate source.
  // Clean blocks are left untouched (they may carry post-migration editor edits);
  // a buggy block with no usable `slateRichText` is left as-is too (never emptied —
  // the no-progress guard then stops the cron rather than destroying content).
  private migrateBlocksFromSlate(blocks: any[]): any[] {
    const fix = (node: any) =>
      (
        this.hasBuggyTextNode(node.richText) &&
        Array.isArray(node.slateRichText) &&
        node.slateRichText.length > 0
      ) ?
        { ...node, richText: this.migrate(node.slateRichText) }
      : node;
    return blocks.map((block: any) => {
      if (['richText', 'linkPageBreak'].includes(block.type)) {
        return fix(block);
      }
      if (block.type === 'listicle' && Array.isArray(block.items)) {
        return { ...block, items: block.items.map(fix) };
      }
      return block;
    });
  }

  // EENEWS-ONLY · TEMPORARY: the importer kept emitting RAW SLATE in `richText`
  // after the mid-import tiptap deploy (no `slateRichText`), so the cron above
  // can't help them. Convert in place + backfill `slateRichText` so a re-run is a
  // no-op. Other apps don't have this shape — the predicate just self-empties to 0.
  private convertRawSlateBlocks(blocks: any[]): any[] {
    const conv = (node: any) =>
      Array.isArray(node.richText) ?
        {
          ...node,
          richText: this.migrate(node.richText),
          slateRichText: node.richText,
        }
      : node;
    return blocks.map((block: any) => {
      if (['richText', 'linkPageBreak'].includes(block.type)) {
        return conv(block);
      }
      if (block.type === 'listicle' && Array.isArray(block.items)) {
        return { ...block, items: block.items.map(conv) };
      }
      return block;
    });
  }

  // Shared revision-table pass: select rows matching `predicate`, apply
  // `transform`, write back only changed rows, stop when none match or no progress.
  private async remigrateRevisionTable(
    cronName: string,
    table: string,
    predicate: string,
    transform: (blocks: any[]) => any[]
  ): Promise<void> {
    const rows = await this.prisma.$queryRawUnsafe<
      { id: string; blocks: unknown }[]
    >(
      `SELECT id, blocks FROM "${table}" WHERE blocks @? $1::jsonpath LIMIT 300`,
      predicate
    );
    if (!rows.length) {
      this.stopCron(cronName, 'none left');
      return;
    }
    let changed = 0;
    for (const row of rows) {
      const blocks =
        typeof row.blocks === 'string' ? JSON.parse(row.blocks) : row.blocks;
      if (!Array.isArray(blocks)) {
        continue;
      }
      const next = transform(blocks);
      if (JSON.stringify(next) === JSON.stringify(blocks)) {
        continue;
      }
      changed++;
      await this.prisma.$executeRawUnsafe(
        `UPDATE "${table}" SET blocks = $1::jsonb WHERE id = $2`,
        JSON.stringify(next),
        row.id
      );
      this.logger.log(`Re-migrated ${table} ${row.id}`);
    }
    if (changed === 0) {
      this.stopCron(
        cronName,
        `no progress (${rows.length} matched, 0 changed)`
      );
    }
  }

  @Cron(CronExpression.EVERY_5_SECONDS, {
    name: 'slate.remigrateBuggyArticles',
    waitForCompletion: true,
  })
  async remigrateBuggyArticles() {
    await this.remigrateRevisionTable(
      'slate.remigrateBuggyArticles',
      'articles.revisions',
      SlateToPmMigrator.BUGGY_TEXT_NODE,
      blocks => this.migrateBlocksFromSlate(blocks)
    );
  }

  @Cron(CronExpression.EVERY_5_SECONDS, {
    name: 'slate.remigrateBuggyPages',
    waitForCompletion: true,
  })
  async remigrateBuggyPages() {
    await this.remigrateRevisionTable(
      'slate.remigrateBuggyPages',
      'pages.revisions',
      SlateToPmMigrator.BUGGY_TEXT_NODE,
      blocks => this.migrateBlocksFromSlate(blocks)
    );
  }

  // EENEWS-ONLY · TEMPORARY — delete after the eenews import cleanup.
  @Cron(CronExpression.EVERY_5_SECONDS, {
    name: 'slate.remigrateEenewsRawSlate',
    waitForCompletion: true,
  })
  async remigrateEenewsRawSlate() {
    await this.remigrateRevisionTable(
      'slate.remigrateEenewsRawSlate',
      'articles.revisions',
      SlateToPmMigrator.RAW_SLATE_RICHTEXT,
      blocks => this.convertRawSlateBlocks(blocks)
    );
  }

  // GENERAL: entity richtext columns re-migrated from their `slate*` source.
  private static readonly BUGGY_ENTITY_COLUMNS: ReadonlyArray<{
    table: string;
    source: string;
    target: string;
  }> = [
    { table: 'authors', source: 'slateBio', target: 'bio' },
    { table: 'comments.revisions', source: 'slateText', target: 'text' },
    { table: 'events', source: 'slateDescription', target: 'description' },
    {
      table: 'peerProfiles',
      source: 'slateCallToActionText',
      target: 'callToActionText',
    },
    { table: 'peers', source: 'slateInformation', target: 'information' },
    { table: 'polls', source: 'slateInfoText', target: 'infoText' },
    { table: 'tags', source: 'slateDescription', target: 'description' },
    {
      table: 'member.plans',
      source: 'slateDescription',
      target: 'description',
    },
    {
      table: 'member.plans',
      source: 'slateShortDescription',
      target: 'shortDescription',
    },
    { table: 'paywalls', source: 'slateDescription', target: 'description' },
    {
      table: 'paywalls',
      source: 'slateUpgradeDescription',
      target: 'upgradeDescription',
    },
    {
      table: 'paywalls',
      source: 'slateCircumventDescription',
      target: 'circumventDescription',
    },
    {
      table: 'paywalls',
      source: 'slateUpgradeCircumventDescription',
      target: 'upgradeCircumventDescription',
    },
  ];

  @Cron(CronExpression.EVERY_5_SECONDS, {
    name: 'slate.remigrateBuggyEntities',
    waitForCompletion: true,
  })
  async remigrateBuggyEntities() {
    let matched = 0;
    let changed = 0;
    for (const {
      table,
      source,
      target,
    } of SlateToPmMigrator.BUGGY_ENTITY_COLUMNS) {
      const rows = await this.prisma.$queryRawUnsafe<
        { id: string; src: unknown; tgt: unknown }[]
      >(
        `SELECT id, "${source}" AS src, "${target}" AS tgt FROM "${table}"
         WHERE "${target}" @? $1::jsonpath AND "${source}" IS NOT NULL
         LIMIT 100`,
        SlateToPmMigrator.BUGGY_TEXT_NODE
      );
      matched += rows.length;
      for (const row of rows) {
        const src =
          typeof row.src === 'string' ?
            JSON.parse(row.src)
          : (row.src as unknown);
        const tgt = typeof row.tgt === 'string' ? JSON.parse(row.tgt) : row.tgt;
        if (!Array.isArray(src) || src.length === 0) {
          continue;
        }
        const next = this.migrate(src);
        if (JSON.stringify(next) === JSON.stringify(tgt)) {
          continue;
        }
        changed++;
        await this.prisma.$executeRawUnsafe(
          `UPDATE "${table}" SET "${target}" = $1::jsonb WHERE id = $2`,
          JSON.stringify(next),
          row.id
        );
        this.logger.log(`Re-migrated ${table}.${target} ${row.id}`);
      }
    }
    if (matched === 0) {
      this.stopCron('slate.remigrateBuggyEntities', 'none left');
    } else if (changed === 0) {
      this.stopCron(
        'slate.remigrateBuggyEntities',
        `no progress (${matched} matched, 0 changed)`
      );
    }
  }
}
