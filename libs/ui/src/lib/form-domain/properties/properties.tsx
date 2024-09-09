import {z} from 'zod'
import {HiddenInputSchema} from '../../form/hidden/hidden'
import {createArrayInputSchema} from '../array/array'

const propertySchema = z.object({
  id: HiddenInputSchema,
  key: z.string().nullish().describe('Key'),
  value: z.string().nullish().describe('Value'),
  public: z.boolean().nullish().describe('Public')
})

export const PropertiesInputSchema = createArrayInputSchema(propertySchema)
