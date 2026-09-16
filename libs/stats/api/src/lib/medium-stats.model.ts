import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

export const MEDIUM_STATS_SCHEMA_VERSION = 1;

@ObjectType()
export class MediumStatsWindow {
  @Field(() => Date)
  from!: Date;

  @Field(() => Date)
  to!: Date;
}

@ObjectType()
export class MediumMoneyStats {
  @Field(() => Int)
  revenue!: number;

  @Field(() => Int)
  expectedRevenue!: number;

  @Field(() => Int)
  atRisk!: number;
}

@ObjectType()
export class MediumDeactivationReasonCount {
  @Field()
  reason!: string;

  @Field(() => Int)
  count!: number;
}

@ObjectType()
export class MediumMembershipStats {
  @Field(() => Int)
  activeSubscribers!: number;

  @Field(() => Int)
  newSubscribers!: number;

  @Field(() => Int)
  deactivations!: number;

  @Field(() => [MediumDeactivationReasonCount])
  deactivationsByReason!: MediumDeactivationReasonCount[];
}

@ObjectType()
export class MediumOperationsStats {
  @Field(() => Date, { nullable: true })
  lastPeriodicJobAt!: Date | null;

  @Field()
  periodicJobFailing!: boolean;

  @Field(() => String, { nullable: true })
  periodicJobError!: string | null;

  @Field(() => Int)
  periodicJobTries!: number;

  @Field(() => Int)
  imageCount!: number;

  @Field(() => Float)
  imageBytes!: number;

  @Field(() => Int)
  documentCount!: number;

  @Field(() => Float)
  documentBytes!: number;

  /** Images plus documents, as uploaded. Excludes derived image variants. */
  @Field(() => Float)
  storageBytes!: number;

  @Field(() => Int)
  mailchimpSyncErrors!: number;
}

@ObjectType()
export class MediumEditorialStats {
  @Field(() => Int)
  articlesCount!: number;

  @Field(() => Int)
  authorsCount!: number;

  @Field(() => Int)
  articlesPublished!: number;

  @Field(() => Date, { nullable: true })
  lastPublishedAt!: Date | null;

  @Field(() => Int)
  pagesCount!: number;

  @Field(() => Int)
  pagesPublished!: number;

  @Field(() => Int)
  articleRevisionsCount!: number;

  @Field(() => Int)
  pageRevisionsCount!: number;
}

@ObjectType()
export class MediumCommunityStats {
  @Field(() => Int)
  commentsPublished!: number;

  @Field(() => Int)
  commentsPendingModeration!: number;

  @Field(() => Int)
  activePolls!: number;

  @Field(() => Int)
  pollVotes!: number;
}

@ObjectType()
export class MediumMailStats {
  @Field(() => Int)
  sends!: number;

  @Field(() => Int)
  failures!: number;

  @Field(() => Int)
  bounced!: number;

  @Field(() => Int)
  rejected!: number;

  @Field(() => Date, { nullable: true })
  lastCampaignAt!: Date | null;
}

@ObjectType()
export class MediumAccountStats {
  @Field(() => Int)
  usersTotal!: number;

  @Field(() => Int)
  usersWithRole!: number;

  @Field(() => Int)
  adminCount!: number;

  @Field(() => Int)
  activeSessions!: number;

  @Field(() => Int)
  usersLoggedIn!: number;
}

@ObjectType()
export class MediumIntegrationsStats {
  @Field(() => Int)
  mailProviders!: number;

  @Field(() => Int)
  paymentProviders!: number;

  @Field(() => Int)
  syncProviders!: number;

  @Field(() => Int)
  analyticsProviders!: number;
}

@ObjectType()
export class MediumNetworkStats {
  @Field(() => Int)
  peersTotal!: number;

  @Field(() => Int)
  peersDisabled!: number;
}

@ObjectType()
export class MediumStats {
  @Field(() => Int)
  schemaVersion!: number;

  @Field(() => Date)
  generatedAt!: Date;

  @Field(() => String, { nullable: true })
  currency!: string | null;

  @Field(() => MediumStatsWindow)
  window!: MediumStatsWindow;

  @Field(() => MediumMoneyStats)
  money!: MediumMoneyStats;

  @Field(() => MediumMembershipStats)
  membership!: MediumMembershipStats;

  @Field(() => MediumOperationsStats)
  operations!: MediumOperationsStats;

  @Field(() => MediumEditorialStats)
  editorial!: MediumEditorialStats;

  @Field(() => MediumCommunityStats)
  community!: MediumCommunityStats;

  @Field(() => MediumMailStats)
  mail!: MediumMailStats;

  @Field(() => MediumAccountStats)
  accounts!: MediumAccountStats;

  @Field(() => MediumIntegrationsStats)
  integrations!: MediumIntegrationsStats;

  @Field(() => MediumNetworkStats)
  network!: MediumNetworkStats;
}
