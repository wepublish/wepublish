import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';
import { BaseBlock } from '../base-block.model';
import { BlockType } from '../block-type.model';

@ObjectType({
  implements: BaseBlock,
})
export class BildwurfAdBlock extends BaseBlock<typeof BlockType.BildwurfAd> {
  @Field({ nullable: true })
  zoneID?: string;
}

@InputType()
export class BildwurfAdBlockInput extends OmitType(
  BildwurfAdBlock,
  ['type'] as const,
  InputType
) {}
