import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { BaseBlock } from '../base-block.model';
import { BlockType } from '../block-type.model';

@ObjectType()
export class MailchimpFormInterestOption {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;
}

@InputType()
export class MailchimpFormInterestOptionInput extends OmitType(
  MailchimpFormInterestOption,
  [] as const,
  InputType
) {}

@ObjectType()
export class MailchimpFormFieldConfig {
  @Field({ nullable: true })
  inputType?: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  label?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  required?: boolean;

  @Field({ nullable: true })
  urlParam?: string;

  @Field({ nullable: true })
  defaultValue?: string;

  @Field({ nullable: true })
  value?: string;

  @Field(() => [MailchimpFormInterestOption], { defaultValue: [] })
  options!: MailchimpFormInterestOption[];
}

@InputType()
export class MailchimpFormFieldConfigInput extends OmitType(
  MailchimpFormFieldConfig,
  ['options'] as const,
  InputType
) {
  @Field(() => [MailchimpFormInterestOptionInput], { defaultValue: [] })
  options!: MailchimpFormInterestOptionInput[];
}

@ObjectType()
export class MailchimpFormStep {
  @Field(() => [String], { defaultValue: [] })
  skipIfFieldsFilled!: string[];

  @Field(() => [String], { defaultValue: [] })
  skipIfInterestsFilled!: string[];

  @Field(() => [String], { defaultValue: [] })
  showIfInterestsFilled!: string[];

  @Field(() => [MailchimpFormFieldConfig], { defaultValue: [] })
  inputs!: MailchimpFormFieldConfig[];
}

@InputType()
export class MailchimpFormStepInput extends OmitType(
  MailchimpFormStep,
  ['inputs'] as const,
  InputType
) {
  @Field(() => [MailchimpFormFieldConfigInput], { defaultValue: [] })
  inputs!: MailchimpFormFieldConfigInput[];
}

@ObjectType()
export class MailchimpFormSuccessOption {
  @Field()
  label!: string;

  @Field()
  background!: string;

  @Field()
  url!: string;

  @Field({ nullable: true })
  mergeFieldName?: string;

  @Field({ nullable: true })
  mergeFieldValue?: string;
}

@InputType()
export class MailchimpFormSuccessOptionInput extends OmitType(
  MailchimpFormSuccessOption,
  [] as const,
  InputType
) {}

@ObjectType()
export class MailchimpFormSuccessPage {
  @Field({ nullable: true })
  description?: string;

  @Field(() => [MailchimpFormSuccessOption], { defaultValue: [] })
  options!: MailchimpFormSuccessOption[];
}

@InputType()
export class MailchimpFormSuccessPageInput extends OmitType(
  MailchimpFormSuccessPage,
  ['options'] as const,
  InputType
) {
  @Field(() => [MailchimpFormSuccessOptionInput], { defaultValue: [] })
  options!: MailchimpFormSuccessOptionInput[];
}

@ObjectType({
  implements: BaseBlock,
})
export class MailchimpFormBlock extends BaseBlock<
  typeof BlockType.MailchimpForm
> {
  @Field({ nullable: true })
  syncProviderId?: string;

  @Field({ nullable: true })
  listId?: string;

  @Field(() => [String], { defaultValue: [] })
  interests!: string[];

  @Field({ defaultValue: true })
  autoFocus!: boolean;

  @Field({ nullable: true })
  doubleOptIn?: boolean;

  @Field({ nullable: true })
  buttonColor?: string;

  @Field({ nullable: true })
  buttonFontColor?: string;

  @Field({ nullable: true })
  submitButtonLabel?: string;

  @Field(() => [MailchimpFormStep], { defaultValue: [] })
  steps!: MailchimpFormStep[];

  @Field({ nullable: true })
  successUrl?: string;

  @Field(() => MailchimpFormSuccessPage, { nullable: true })
  successPage?: MailchimpFormSuccessPage;
}

@InputType()
export class MailchimpFormBlockInput extends OmitType(
  MailchimpFormBlock,
  ['type', 'steps', 'successPage'] as const,
  InputType
) {
  @Field(() => [MailchimpFormStepInput], { defaultValue: [] })
  steps!: MailchimpFormStepInput[];

  @Field(() => MailchimpFormSuccessPageInput, { nullable: true })
  successPage?: MailchimpFormSuccessPageInput;
}
