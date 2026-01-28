import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { BaseBlock } from '../base-block.model';
import { BlockType } from '../block-type.model';

@ObjectType({
  implements: BaseBlock,
})
export class TitleBlock extends BaseBlock<typeof BlockType.Title> {
  @Field({ nullable: true })
  preTitle?: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  lead?: string;
}

@InputType()
export class TitleBlockInput extends OmitType(
  TitleBlock,
  ['type'] as const,
  InputType
) {}
