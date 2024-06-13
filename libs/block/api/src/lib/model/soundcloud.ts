import {Field, InputType, ObjectType} from '@nestjs/graphql'

@ObjectType()
export class SoundCloudTrackBlock {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String)
  trackID!: string
}

@InputType()
export class SoundCloudTrackBlockInput {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => String)
  trackID!: string
}
