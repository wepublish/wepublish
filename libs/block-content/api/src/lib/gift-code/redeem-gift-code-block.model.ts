import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { BaseBlock } from '../base-block.model';
import { BlockType } from '../block-type.model';
import { SubscribeBlockField } from '../subscribe/subscribe-block-field.model';

@ObjectType({
  implements: BaseBlock,
})
export class RedeemGiftCodeBlock extends BaseBlock<
  typeof BlockType.RedeemGiftCode
> {
  @Field(() => [SubscribeBlockField], {
    defaultValue: [
      SubscribeBlockField.FirstName,
      SubscribeBlockField.Password,
      SubscribeBlockField.PasswordRepeated,
    ],
  })
  fields!: SubscribeBlockField[];
}

@InputType()
export class RedeemGiftCodeBlockInput extends OmitType(
  RedeemGiftCodeBlock,
  ['type'] as const,
  InputType
) {}
