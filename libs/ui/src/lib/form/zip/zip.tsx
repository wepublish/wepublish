import {createUniqueFieldSchema, useDescription, useTsController} from '@ts-react/form'
import {z} from 'zod'

import {TextField} from '../../text-field/text-field'

export const ZIPInputSchema = createUniqueFieldSchema(
  z.string().regex(/^\d{4}$/, 'ZIP must be 4 digits long'),
  'zip'
)

export function ZIPInput() {
  const {field, error} = useTsController<string>()
  const {label} = useDescription()

  return (
    <TextField
      {...field}
      value={field.value ?? ''}
      autoComplete="zip"
      type={'zip'}
      label={label}
      error={!!error}
      helperText={error?.errorMessage}
      onChange={e => field.onChange(e.target.value)}
    />
  )
}
