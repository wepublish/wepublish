import {
  Args,
  Field,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { CanRunMailchimpSync } from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import { MailchimpSyncService } from './mailchimp-sync.service';
import { GraphQLJSONObject } from 'graphql-type-json';

@ObjectType()
export class MailchimpSyncDryRunChange {
  @Field()
  email!: string;

  @Field()
  isNew!: boolean;

  @Field(() => GraphQLJSONObject)
  mergeFields!: Record<string, string>;

  @Field(() => GraphQLJSONObject)
  interests!: Record<string, boolean>;

  @Field(() => GraphQLJSONObject, { nullable: true })
  previousMergeFields?: Record<string, string> | null;

  @Field(() => GraphQLJSONObject, { nullable: true })
  previousInterests?: Record<string, boolean> | null;
}

@ObjectType()
export class MailchimpSyncDryRunResult {
  @Field(() => Int)
  updatedCount!: number;

  @Field(() => Int)
  skippedCount!: number;

  @Field(() => Int)
  totalUserCount!: number;

  @Field(() => [MailchimpSyncDryRunChange])
  changes!: MailchimpSyncDryRunChange[];
}

@ObjectType()
export class MailchimpList {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field(() => Int)
  memberCount!: number;
}

@ObjectType()
export class MailchimpMergeField {
  @Field()
  tag!: string;

  @Field()
  name!: string;

  @Field()
  type!: string;
}

@ObjectType()
export class MailchimpInterestGroup {
  @Field()
  id!: string;

  @Field()
  name!: string;
}

@ObjectType()
export class MailchimpSyncErrorType {
  @Field()
  id!: string;

  @Field()
  createdAt!: Date;

  @Field()
  userId!: string;

  @Field()
  syncProviderId!: string;

  @Field()
  email!: string;

  @Field()
  errorMessage!: string;

  @Field(() => Int, { nullable: true })
  statusCode?: number | null;
}

@ObjectType()
export class MailchimpSyncErrorList {
  @Field(() => [MailchimpSyncErrorType])
  nodes!: MailchimpSyncErrorType[];

  @Field(() => Int)
  totalCount!: number;
}

@Resolver()
export class MailchimpSyncResolver {
  constructor(private mailchimpSyncService: MailchimpSyncService) {}

  @Permissions(CanRunMailchimpSync)
  @Query(returns => [MailchimpList], {
    name: 'mailchimpLists',
    description:
      'Fetches available Mailchimp lists/audiences for a sync config.',
  })
  async mailchimpLists(
    @Args('configId') configId: string
  ): Promise<MailchimpList[]> {
    return this.mailchimpSyncService.getMailchimpLists(configId);
  }

  @Permissions(CanRunMailchimpSync)
  @Query(returns => [MailchimpMergeField], {
    name: 'mailchimpMergeFields',
    description: 'Fetches available merge fields for a Mailchimp list.',
  })
  async mailchimpMergeFields(
    @Args('configId') configId: string,
    @Args('listId') listId: string
  ): Promise<MailchimpMergeField[]> {
    return this.mailchimpSyncService.getMailchimpMergeFields(configId, listId);
  }

  @Permissions(CanRunMailchimpSync)
  @Query(returns => [MailchimpInterestGroup], {
    name: 'mailchimpInterestGroups',
    description: 'Fetches available interest groups for a Mailchimp list.',
  })
  async mailchimpInterestGroups(
    @Args('configId') configId: string,
    @Args('listId') listId: string
  ): Promise<MailchimpInterestGroup[]> {
    return this.mailchimpSyncService.getMailchimpInterestCategories(
      configId,
      listId
    );
  }

  @Permissions(CanRunMailchimpSync)
  @Mutation(returns => Boolean, {
    name: 'triggerMailchimpSync',
    description: 'Triggers a mailchimp sync for a given setting.',
  })
  async triggerMailchimpSync(@Args('id') id: string): Promise<boolean> {
    await this.mailchimpSyncService.executeSyncById(id);
    return true;
  }

  @Permissions(CanRunMailchimpSync)
  @Mutation(returns => MailchimpSyncDryRunResult, {
    name: 'dryRunMailchimpSync',
    description:
      'Simulates a mailchimp sync without making changes. Returns what would be updated.',
  })
  async dryRunMailchimpSync(
    @Args('id') id: string,
    @Args('limit', { nullable: true, type: () => Int }) limit?: number
  ): Promise<MailchimpSyncDryRunResult> {
    const result = await this.mailchimpSyncService.executeSyncById(
      id,
      true,
      limit
    );
    return (
      result ?? {
        updatedCount: 0,
        skippedCount: 0,
        totalUserCount: 0,
        changes: [],
      }
    );
  }

  @Permissions(CanRunMailchimpSync)
  @Query(returns => MailchimpSyncErrorList, {
    name: 'mailchimpSyncErrors',
    description: 'Returns sync errors for a given config.',
  })
  async mailchimpSyncErrors(
    @Args('configId') configId: string,
    @Args('take', { nullable: true, type: () => Int }) take?: number,
    @Args('skip', { nullable: true, type: () => Int }) skip?: number
  ): Promise<MailchimpSyncErrorList> {
    return this.mailchimpSyncService.getSyncErrors(
      configId,
      take ?? 20,
      skip ?? 0
    );
  }

  @Permissions(CanRunMailchimpSync)
  @Mutation(returns => Boolean, {
    name: 'deleteMailchimpSyncError',
    description: 'Deletes a single sync error so the contact will be retried.',
  })
  async deleteMailchimpSyncError(@Args('id') id: string): Promise<boolean> {
    await this.mailchimpSyncService.deleteSyncError(id);
    return true;
  }

  @Permissions(CanRunMailchimpSync)
  @Mutation(returns => Boolean, {
    name: 'deleteAllMailchimpSyncErrors',
    description:
      'Deletes all sync errors for a config so all contacts will be retried.',
  })
  async deleteAllMailchimpSyncErrors(
    @Args('configId') configId: string
  ): Promise<boolean> {
    await this.mailchimpSyncService.deleteAllSyncErrors(configId);
    return true;
  }
}
