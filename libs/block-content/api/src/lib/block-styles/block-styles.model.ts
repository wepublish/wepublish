import {ArgsType, Field, ObjectType, PartialType, PickType, registerEnumType} from '@nestjs/graphql'
import {BlockType} from '@prisma/client'

registerEnumType(BlockType, {name: 'BlockStyleType'})

@ObjectType()
export class BlockStyle {
  @Field()
  id!: string

  @Field()
  createdAt!: Date

  @Field()
  modifiedAt!: Date

  @Field()
  name!: string

  @Field(type => [BlockType])
  blocks!: BlockType[]
}

@ArgsType()
export class CreateBlockStyleInput extends PickType(
  BlockStyle,
  ['name', 'blocks'] as const,
  ArgsType
) {}

@ArgsType()
export class UpdateBlockStyleInput extends PartialType(CreateBlockStyleInput, ArgsType) {
  @Field()
  id!: string
}
