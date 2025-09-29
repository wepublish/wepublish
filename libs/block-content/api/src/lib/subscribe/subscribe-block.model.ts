import {
  Field,
  InputType,
  ObjectType,
  OmitType,
  registerEnumType,
} from '@nestjs/graphql';
import { BaseBlock } from '../base-block.model';
import { BlockType } from '../block-type.model';
import { MemberPlan } from '@wepublish/member-plan/api';

export enum SubscribeBlockFields {
  FirstName = 'firstName',
  Address = 'address',
  Birthday = 'birthday',
  EmailRepeated = 'emailRepeated',
  Password = 'password',
  PasswordRepeat = 'passwordRepeat',
}

registerEnumType(SubscribeBlockFields, {
  name: 'SubscribeBlockFields',
});

@ObjectType({
  implements: BaseBlock,
})
export class SubscribeBlock extends BaseBlock<typeof BlockType.Subscribe> {
  @Field(() => [SubscribeBlockFields])
  fields!: SubscribeBlockFields[];

  @Field(() => [String], { nullable: true })
  memberPlanIds?: string[];

  @Field(() => [MemberPlan])
  memberPlans!: MemberPlan[];
}

@InputType()
export class SubscribeBlockInput extends OmitType(
  SubscribeBlock,
  ['type', 'memberPlans'] as const,
  InputType
) {}
