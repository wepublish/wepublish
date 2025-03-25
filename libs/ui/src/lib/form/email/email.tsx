import * as v from 'valibot'

import {TextField} from '../../text-field/text-field'
import {InputComponentProps} from '@wepublish/website/form-builder'

export const EmailInputSchema = v.pipe(v.string(), v.email(), v.nonEmpty(), v.brand('email'))

export function EmailInput({
  field,
  fieldState: {error},
  description,
  title = 'Email',
  name
}: InputComponentProps) {
  return (
    <TextField
      {...field}
      value={field.value ?? ''}
      autoComplete="email"
      type={'email'}
      fullWidth
      label={title}
      error={!!error}
      helperText={error?.message ?? description}
      onChange={e => field.onChange(e.target.value)}
    />
  )
}
