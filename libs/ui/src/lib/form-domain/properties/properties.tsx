import {HiddenInputSchema} from '../../form/hidden/hidden'
import * as v from 'valibot'

const propertySchema = v.object({
  id: HiddenInputSchema,
  key: v.pipe(v.string(), v.empty(), v.title('Key')),
  value: v.pipe(v.string(), v.empty(), v.title('Value')),
  public: v.pipe(v.boolean(), v.title('Public'))
})

export const PropertiesInputSchema = v.array(propertySchema)
