import { NotFoundException } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  CanCreateEngagementRule,
  CanDeleteEngagementRule,
  CanGetEngagementRule,
  CanGetEngagementRules,
  CanUpdateEngagementRule,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import {
  CreateEngagementRuleInput,
  EngagementRule,
  UpdateEngagementRuleInput,
} from './engagement-rule.model';
import { EngagementRuleService } from './engagement-rule.service';

@Resolver(() => EngagementRule)
export class EngagementRuleResolver {
  constructor(private rules: EngagementRuleService) {}

  @Permissions(CanGetEngagementRules)
  @Query(() => [EngagementRule], {
    description: `All engagement rules, highest priority first.`,
  })
  engagementRules() {
    return this.rules.getRules();
  }

  @Permissions(CanGetEngagementRule)
  @Query(() => EngagementRule)
  async engagementRule(@Args('id') id: string) {
    const rule = await this.rules.getRule(id);

    if (!rule) {
      throw new NotFoundException(`Engagement rule with id ${id} not found`);
    }

    return rule;
  }

  @Permissions(CanCreateEngagementRule)
  @Mutation(() => EngagementRule)
  createEngagementRule(@Args('input') input: CreateEngagementRuleInput) {
    return this.rules.create(input);
  }

  @Permissions(CanUpdateEngagementRule)
  @Mutation(() => EngagementRule, {
    description: `Replaces the rule's stages and bumps its version.`,
  })
  updateEngagementRule(@Args('input') input: UpdateEngagementRuleInput) {
    return this.rules.update(input);
  }

  @Permissions(CanDeleteEngagementRule)
  @Mutation(() => EngagementRule)
  deleteEngagementRule(@Args('id') id: string) {
    return this.rules.delete(id);
  }
}
