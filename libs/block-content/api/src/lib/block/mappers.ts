import {Block, BlockInput} from './block.model'
import {BlockType} from './block-type'
import {TeaserGridFlexBlock, TeaserGridFlexBlockInput} from './model/teaser-flex-grid'
import {TeaserGridBlock, TeaserGridBlockInput} from './model/teaser-grid'
import {Teaser, TeaserInput} from './model/teaser'
import {Prisma} from '@prisma/client'

function mapTeaserInputToTeaser(value: any) {
  if (!value) return null

  const valueKeys = Object.keys(value)

  if (valueKeys.length === 0) {
    throw new Error(`Received no teaser types in ${TeaserInput.name}.`)
  }

  if (valueKeys.length > 1) {
    throw new Error(
      `Received multiple teaser types (${JSON.stringify(Object.keys(value))}) in ${
        TeaserInput.name
      }, they're mutually exclusive.`
    )
  }

  const type = Object.keys(value)[0] as keyof TeaserInput
  const teaserValue = value[type]

  return {type, ...teaserValue} as Teaser
}

export function mapBlockInputToPrisma(value: BlockInput): Prisma.InputJsonValue {
  const valueKeys = Object.keys(value)

  if (valueKeys.length === 0) {
    throw new Error(`Received no block types in ${BlockInput.name}.`)
  }

  if (valueKeys.length > 1) {
    throw new Error(
      `Received multiple block types (${JSON.stringify(Object.keys(value))}) in ${
        BlockInput.name
      }, they're mutually exclusive.`
    )
  }

  const type = valueKeys[0] as keyof BlockInput
  const blockValue = value[type]

  switch (type) {
    case BlockType.TeaserGrid:
      return {
        type,
        ...blockValue,
        teasers: (blockValue as TeaserGridBlockInput).teasers.map(mapTeaserInputToTeaser)
      } as TeaserGridBlock & Prisma.InputJsonValue

    case BlockType.TeaserGridFlex:
      return {
        type,
        ...blockValue,
        flexTeasers: (blockValue as TeaserGridFlexBlockInput).flexTeasers.map(
          ({teaser, ...value}: any) => ({
            ...value,
            teaser: mapTeaserInputToTeaser(teaser)
          })
        )
      } as TeaserGridFlexBlock & Prisma.InputJsonValue

    default:
      return {
        type,
        ...blockValue
      } as Block & Prisma.InputJsonValue
  }
}
