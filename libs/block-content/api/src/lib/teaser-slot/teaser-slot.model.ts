import {Field, InputType, ObjectType, OmitType, registerEnumType} from '@nestjs/graphql'
import {Teaser, TeaserInput} from '../teaser/teaser.model'

export enum TeaserSlotType {
  Autofill = 'Autofill',
  Manual = 'Manual'
}

registerEnumType(TeaserSlotType, {
  name: 'TeaserSlotType'
})

@ObjectType()
export class TeaserSlot {
  @Field(() => TeaserSlotType, {defaultValue: TeaserSlotType.Autofill})
  type!: TeaserSlotType

  @Field(() => Teaser)
  teaser?: typeof Teaser
}

@InputType()
export class TeaserSlotInput extends OmitType(TeaserSlot, ['teaser'] as const, InputType) {
  @Field(() => TeaserInput, {nullable: true})
  teaser?: TeaserInput
}
