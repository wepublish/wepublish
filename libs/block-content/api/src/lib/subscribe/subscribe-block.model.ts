import {
  Field,
  InputType,
  Int,
  InterfaceType,
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

export enum SubscribePeriodicityDisplay {
  Dropdown = 'dropdown',
  OfferCards = 'offerCards',
}

registerEnumType(SubscribePeriodicityDisplay, {
  name: 'SubscribePeriodicityDisplay',
});

export enum SubscribeBlockRenderLayout {
  None = 'none',
  Slider = 'slider',
  Picker = 'picker',
}

registerEnumType(SubscribeBlockRenderLayout, {
  name: 'SubscribeBlockRenderLayout',
});

@InterfaceType({
  isAbstract: true,
  resolveType(value: SubscribeBlockLayoutConfig) {
    switch (value.type.toLowerCase()) {
      case SubscribeBlockRenderLayout.Slider:
        return SubscribeBlockLayoutSliderConfig;
      case SubscribeBlockRenderLayout.Picker:
        return SubscribeBlockLayoutPickerConfig;
      case SubscribeBlockRenderLayout.None:
      default:
        return SubscribeBlockLayoutNoneConfig;
    }
  },
})
export class SubscribeBlockLayoutConfig {
  @Field(() => SubscribeBlockRenderLayout)
  type!: SubscribeBlockRenderLayout;
}

@ObjectType({
  implements: () => [SubscribeBlockLayoutConfig],
})
export class SubscribeBlockLayoutNoneConfig extends SubscribeBlockLayoutConfig {
  override type!: SubscribeBlockRenderLayout.None;
}

@ObjectType({
  implements: () => [SubscribeBlockLayoutConfig],
})
export class SubscribeBlockLayoutSliderConfig extends SubscribeBlockLayoutConfig {
  override type!: SubscribeBlockRenderLayout.Slider;

  @Field({ defaultValue: false })
  showInput!: boolean;
}

@ObjectType({
  implements: () => [SubscribeBlockLayoutConfig],
})
export class SubscribeBlockLayoutPickerConfig extends SubscribeBlockLayoutConfig {
  override type!: SubscribeBlockRenderLayout.Picker;

  @Field({ defaultValue: false })
  showInput!: boolean;

  @Field(() => [Int])
  values!: number[];
}

@InputType()
export class SubscribeBlockLayoutConfigInput extends OmitType(
  SubscribeBlockLayoutConfig,
  [] as const,
  InputType
) {
  // For slider & picker
  @Field({ defaultValue: false })
  showInput!: boolean;
  // For picker
  @Field(() => [Int], { nullable: true })
  values?: number[];
}

@ObjectType()
export class SubscribeBlockMemberPlanRenderSetting {
  @Field()
  memberPlanId!: string;

  @Field(() => SubscribeBlockLayoutConfig)
  layout!: SubscribeBlockLayoutConfig;

  @Field({ defaultValue: false })
  isDefault!: boolean;
}

@InputType()
export class SubscribeBlockMemberPlanRenderSettingInput extends OmitType(
  SubscribeBlockMemberPlanRenderSetting,
  ['layout'] as const,
  InputType
) {
  @Field(() => SubscribeBlockLayoutConfigInput)
  layout!: SubscribeBlockLayoutConfigInput;
}

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

  @Field(() => [String], { defaultValue: [] })
  memberPlanIds?: string[];

  @Field(() => SubscribePeriodicityDisplay, { nullable: true })
  periodicityDisplay?: SubscribePeriodicityDisplay;
  @Field(() => [SubscribeBlockMemberPlanRenderSetting], { defaultValue: [] })
  memberPlanRenderSettings?: SubscribeBlockMemberPlanRenderSetting[];

  @Field(() => Boolean, { defaultValue: false })
  showDiscountCodes!: boolean;

  @Field(() => Boolean, { defaultValue: false })
  showGoodies!: boolean;
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
  ['type', 'memberPlans', 'memberPlanRenderSettings'] as const,
  InputType
) {
  @Field(() => [SubscribeBlockMemberPlanRenderSettingInput])
  memberPlanRenderSettings?: SubscribeBlockMemberPlanRenderSettingInput[];
}
