import { Injectable, Logger } from '@nestjs/common';
import { RichtextElements, RichtextJSONDocument } from '@wepublish/richtext';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { Prisma, PrismaClient } from '@prisma/client';

const slateToPm = (content: any): RichtextElements | [] => {
  const children = content.children.flatMap(
    (child: any): RichtextElements | [] => {
      // Treat links as if they don't have a type
      if (child.type && child.type !== 'link') {
        return slateToPm(child);
      }

      const isLink = 'type' in child && child.type === 'link';

      // No type (or link type) = text node
      return {
        type: 'text',
        attrs: undefined,
        text: isLink ? child.title : child.text,
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
      take: 30,
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

    if (revisions.length < 30) {
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
    ]);

    if (
      paywallsByDescription.length < 30 &&
      paywallsByCircumventDescription.length < 30
    ) {
      this.schedulerRegistry.deleteCronJob('slate.migratePaywalls');
      this.logger.warn(
        'Stopped `slate.migratePaywalls` cronjob as all have been migrated'
      );
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS, {
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
      take: 30,
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

    if (revisions.length < 30) {
      this.schedulerRegistry.deleteCronJob('slate.migrateArticles');
      this.logger.warn(
        'Stopped `slate.migrateArticles` cronjob as all have been migrated'
      );
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS, {
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
      take: 30,
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

    if (revisions.length < 30) {
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
}
