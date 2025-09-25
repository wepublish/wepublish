import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { BaseBlock } from '../base-block.model';
import { BlockType } from '../block-type.model';

@ObjectType({
  implements: BaseBlock,
})
export class YouTubeVideoBlock extends BaseBlock<
  typeof BlockType.YouTubeVideo
> {
  @Field({ nullable: true })
  videoID?: string;
}

@InputType()
export class YouTubeVideoBlockInput extends OmitType(
  YouTubeVideoBlock,
  ['type'] as const,
  InputType
) {}
