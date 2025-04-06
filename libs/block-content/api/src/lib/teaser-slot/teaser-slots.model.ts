import {Field, InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {BaseBlock} from '../base-block.model'
import {BlockType} from '../block-type.model'
import {
  TeaserSlotsAutofillConfig,
  TeaserSlotsAutofillConfigInput
} from './teaser-slots-autofill-config.model'
import {TeaserSlot, TeaserSlotInput} from './teaser-slot.model'
import {Teaser} from '../teaser/teaser.model'

@ObjectType({
  implements: () => [BaseBlock]
})
export class TeaserSlotsBlock extends BaseBlock<BlockType.TeaserSlots> {
  @Field({nullable: true})
  title?: string

  @Field(() => TeaserSlotsAutofillConfig)
  autofillConfig!: TeaserSlotsAutofillConfig

  @Field(() => [TeaserSlot])
  slots!: Array<TeaserSlot>

  @Field(() => [Teaser], {
    // not nullable but teaser grid/flex can be and it uses the same property,
    // so they have to be the same
    nullable: 'items'
  })
  teasers!: Array<typeof Teaser | null>
}

@InputType()
export class TeaserSlotsBlockInput extends OmitType(
  TeaserSlotsBlock,
  ['teasers', 'slots', 'autofillConfig', 'type'] as const,
  InputType
) {
  @Field(() => [TeaserSlotInput])
  slots!: Array<TeaserSlotInput>

  @Field(() => TeaserSlotsAutofillConfigInput)
  autofillConfig!: TeaserSlotsAutofillConfigInput
}

export function isTeaserSlotsBlock(block: BaseBlock<BlockType>): block is TeaserSlotsBlock {
  return block.type === BlockType.TeaserSlots
}
