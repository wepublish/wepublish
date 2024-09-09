import {createUniqueFieldSchema, useDescription, useTsController} from '@ts-react/form'
import {z} from 'zod'

import {TextField} from '../../text-field/text-field'

export const PhoneInputSchema = createUniqueFieldSchema(
  z
    .string()
    .regex(/(\b(0041|0)|\B\+41)(\s?\(0\))?(\s)?[1-9]{2}(\s)?[0-9]{3}(\s)?[0-9]{2}(\s)?[0-9]{2}\b/),
  'phone'
)

export function PhoneInput() {
  const {field, error} = useTsController<string>()
  const {label = 'Phone', placeholder} = useDescription()

  return (
    <TextField
      {...field}
      value={field.value ?? ''}
      autoComplete="phone"
      type={'phone'}
      fullWidth
      label={label}
      error={!!error}
      helperText={error?.errorMessage ?? placeholder}
      onChange={e => field.onChange(e.target.value)}
    />
  )
}
