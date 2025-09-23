import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { BaseBlock } from '../base-block.model';
import { BlockType } from '../block-type.model';

@ObjectType({
  implements: BaseBlock,
})
export class VimeoVideoBlock extends BaseBlock<typeof BlockType.VimeoVideo> {
  @Field({ nullable: true })
  videoID?: string;
}

@InputType()
export class VimeoVideoBlockInput extends OmitType(
  VimeoVideoBlock,
  ['type'] as const,
  InputType
) {}
