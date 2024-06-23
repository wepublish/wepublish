import {Field, InputType, ObjectType, OmitType} from '@nestjs/graphql'

@ObjectType()
export class BildwurfAdBlock {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String)
  zoneID!: string
}

@InputType()
export class BildwurfAdBlockInput extends OmitType(BildwurfAdBlock, [], InputType) {}
