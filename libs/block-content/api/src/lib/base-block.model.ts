import {Field, ID, InterfaceType, ObjectType} from '@nestjs/graphql'

@InterfaceType()
export abstract class BaseBlock<Type extends string> {
  @Field(() => String)
  type!: Type

  @Field(() => ID, {nullable: true})
  blockStyle?: string
}

@ObjectType()
export class UnknownBlock extends BaseBlock<any> {}
