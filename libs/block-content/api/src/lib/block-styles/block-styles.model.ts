import {
  ArgsType,
  Field,
  ObjectType,
  PartialType,
  PickType,
  registerEnumType,
} from '@nestjs/graphql';
import { BlockType as EditorBlockType } from '@prisma/client';

registerEnumType(EditorBlockType, {
  name: 'EditorBlockType',
});

@ObjectType()
export class BlockStyle {
  @Field()
  id!: string;

  @Field()
  createdAt!: Date;

  @Field()
  modifiedAt!: Date;

  @Field()
  name!: string;

  @Field(type => [EditorBlockType])
  blocks!: EditorBlockType[];
}

@ArgsType()
export class CreateBlockStyleInput extends PickType(
  BlockStyle,
  ['name', 'blocks'] as const,
  ArgsType
) {}

@ArgsType()
export class UpdateBlockStyleInput extends PartialType(
  CreateBlockStyleInput,
  ArgsType
) {
  @Field()
  id!: string;
}
