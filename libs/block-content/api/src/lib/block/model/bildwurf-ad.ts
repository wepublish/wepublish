import {Field, InputType, ObjectType} from '@nestjs/graphql'

@ObjectType()
export class BildwurfAdBlock {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String)
  zoneID!: string
}

@InputType()
export class BildwurfAdBlockInput extends BildwurfAdBlock {}
