import { Field, InterfaceType, ObjectType } from '@nestjs/graphql';
import { BlockType } from './block-type.model';
import { BlockTiming } from './timing/block-timing.model';

@InterfaceType()
export abstract class BaseBlock<Type extends BlockType> {
  @Field(() => BlockType)
  type!: Type;

  @Field({ nullable: true })
  disabled?: boolean;

  @Field(() => BlockTiming, {
    nullable: true,
    description:
      'The window during which the block is displayed. Every part of it has to apply at once; without a window the block always shows.',
  })
  timing?: BlockTiming;

  @Field({ nullable: true })
  blockStyle?: string;

  @Field({ nullable: true })
  blockStyleName?: string;
}

@ObjectType()
export class UnknownBlock extends BaseBlock<any> {}
