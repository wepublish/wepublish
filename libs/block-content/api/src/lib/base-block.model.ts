import { Field, InterfaceType, ObjectType } from '@nestjs/graphql';
import { BlockType } from './block-type.model';

@InterfaceType()
export abstract class BaseBlock<Type extends BlockType> {
  @Field(() => BlockType)
  type!: Type;

  @Field({ nullable: true })
  blockStyle?: string;

  @Field({ nullable: true })
  blockStyleName?: string;
}

@ObjectType()
export class UnknownBlock extends BaseBlock<any> {}
