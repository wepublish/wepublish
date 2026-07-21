import {
  Field,
  InputType,
  Int,
  ObjectType,
  OmitType,
  registerEnumType,
} from '@nestjs/graphql';
import { BaseBlock } from '../base-block.model';
import { BlockType } from '../block-type.model';
import { MemberPlan } from '@wepublish/member-plan/api';

export enum SubscribeBlockField {
  FirstName = 'firstName',
  Address = 'address',
  Birthday = 'birthday',
  EmailRepeated = 'emailRepeated',
  Password = 'password',
  PasswordRepeated = 'passwordRepeated',
}

registerEnumType(SubscribeBlockField, {
  name: 'SubscribeBlockField',
});

export enum SubscribeBlockPlanRenderStyle {
  Card = 'card',
  Slider = 'slider',
  CardAndSlider = 'cardAndSlider',
  CardFreeInput = 'cardFreeInput',
  AmountTiles = 'amountTiles',
}

registerEnumType(SubscribeBlockPlanRenderStyle, {
  name: 'SubscribeBlockPlanRenderStyle',
});

export enum SubscribeBlockAmountTileLayout {
  Narrow = 'narrow',
  Wide = 'wide',
}

registerEnumType(SubscribeBlockAmountTileLayout, {
  name: 'SubscribeBlockAmountTileLayout',
});

@ObjectType()
export class SubscribeBlockPlanSetting {
  @Field()
  memberPlanId!: string;

  @Field(() => SubscribeBlockPlanRenderStyle)
  renderStyle!: SubscribeBlockPlanRenderStyle;

  @Field(() => [Int], { nullable: true })
  amountTileValues?: number[];

  @Field(() => SubscribeBlockAmountTileLayout, { nullable: true })
  amountTileLayout?: SubscribeBlockAmountTileLayout;

  @Field(() => Boolean, { nullable: true })
  isDefault?: boolean;
}

@InputType()
export class SubscribeBlockPlanSettingInput extends OmitType(
  SubscribeBlockPlanSetting,
  [] as const,
  InputType
) {}

@ObjectType({
  implements: BaseBlock,
})
export class SubscribeBlock extends BaseBlock<typeof BlockType.Subscribe> {
  @Field(() => [SubscribeBlockField], {
    defaultValue: [
      SubscribeBlockField.FirstName,
      SubscribeBlockField.Password,
      SubscribeBlockField.PasswordRepeated,
      SubscribeBlockField.Address,
    ],
  })
  fields!: SubscribeBlockField[];

  @Field(() => [String], { nullable: true })
  memberPlanIds?: string[];

  @Field(() => [SubscribeBlockPlanSetting], { nullable: true })
  plans?: SubscribeBlockPlanSetting[];

  @Field(() => Boolean, { defaultValue: false })
  showGoodies!: boolean;

  @Field(() => Boolean, { defaultValue: false })
  showVouchers!: boolean;

  @Field(() => Int, { nullable: true })
  goodieMinValue?: number;

  @Field(() => Boolean, { defaultValue: false })
  hideRepeatGoodieOnUpgrade!: boolean;

  @Field(() => [MemberPlan])
  memberPlans!: MemberPlan[];
}

@InputType()
export class SubscribeBlockInput extends OmitType(
  SubscribeBlock,
  ['type', 'memberPlans', 'plans'] as const,
  InputType
) {
  @Field(() => [SubscribeBlockPlanSettingInput], { nullable: true })
  plans?: SubscribeBlockPlanSettingInput[];
}
