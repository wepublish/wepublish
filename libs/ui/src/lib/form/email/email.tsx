import {createUniqueFieldSchema, useDescription, useTsController} from '@ts-react/form'
import {z} from 'zod'

import {TextField} from '../../text-field/text-field'

export const EmailInputSchema = createUniqueFieldSchema(z.string().email().min(1), 'email')

export function EmailInput() {
  const {field, error} = useTsController<string>()
  const {label = 'Email', placeholder} = useDescription()

  return (
    <TextField
      {...field}
      value={field.value ?? ''}
      autoComplete="email"
      type={'email'}
      fullWidth
      label={label}
      error={!!error}
      helperText={error?.errorMessage ?? placeholder}
      onChange={e => field.onChange(e.target.value)}
    />
  )
}
