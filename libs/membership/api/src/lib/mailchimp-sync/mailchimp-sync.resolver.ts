import {
  Args,
  Field,
  Int,
  Mutation,
  ObjectType,
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

  @Field(() => [MailchimpSyncDryRunChange])
  changes!: MailchimpSyncDryRunChange[];
}

@Resolver()
export class MailchimpSyncResolver {
  constructor(private mailchimpSyncService: MailchimpSyncService) {}

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
    @Args('id') id: string
  ): Promise<MailchimpSyncDryRunResult> {
    const result = await this.mailchimpSyncService.executeSyncById(id, true);
    return result ?? { updatedCount: 0, skippedCount: 0, changes: [] };
  }
}
