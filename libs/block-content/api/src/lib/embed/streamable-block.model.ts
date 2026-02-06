import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { BaseBlock } from '../base-block.model';
import { BlockType } from '../block-type.model';

@ObjectType({
  implements: BaseBlock,
})
export class StreamableVideoBlock extends BaseBlock<
  typeof BlockType.StreamableVideo
> {
  @Field({ nullable: true })
  videoID?: string;
}

@InputType()
export class StreamableVideoBlockInput extends OmitType(
  StreamableVideoBlock,
  ['type'] as const,
  InputType
) {}
