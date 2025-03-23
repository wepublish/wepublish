import {getBrandName} from './utility/get-brand-name'
import {FormSchemaMapping, InputSchemaMapping} from './utility/input-schema-mapping'
import {hasBrandAction} from './utility/is-action'
import {isArraySchema, isEnumSchema} from './utility/is-schema'

export const getComponentBySchema = <Mapping extends FormSchemaMapping>(
  mapping: Mapping,
  input: InputSchemaMapping[0]
): InputSchemaMapping[1] | undefined => {
  let result: InputSchemaMapping | undefined | null

  if (isArraySchema(input)) {
    result =
      mapping.find(([schema]) => isArraySchema(schema) && input.item.type === schema.item.type) ??
      null
  }

  if (isEnumSchema(input)) {
    result = mapping.find(([schema]) => isEnumSchema(schema) && input.enum === schema.enum) ?? null
  }

  if (hasBrandAction(input)) {
    const brand = getBrandName(input)

    if (brand) {
      result =
        mapping.find(([schema]) => hasBrandAction(schema) && brand === getBrandName(schema)) ?? null
    }
  }

  // Only find result by type if it wasn't one of the previous conditions
  // Checking for undefined as it might be null
  if (result === undefined) {
    result = mapping.find(([schema]) => input.type === schema.type)
  }

  if (!result) {
    console.warn(`getComponentBySchema: Could not find component for schema`, input)
  }

  return result?.[1]
}
