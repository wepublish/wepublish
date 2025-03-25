import * as v from 'valibot'

import {TextField} from '../../text-field/text-field'
import {InputComponentProps} from '@wepublish/website/form-builder'

export const PhoneInputSchema = v.pipe(
  v.string(),
  v.regex(/(\b(0041|0)|\B\+41)(\s?\(0\))?(\s)?[1-9]{2}(\s)?[0-9]{3}(\s)?[0-9]{2}(\s)?[0-9]{2}\b/),
  v.brand('phone')
)

export function PhoneInput({
  field,
  fieldState: {error},
  description,
  title = 'Phone',
  name
}: InputComponentProps) {
  return (
    <TextField
      {...field}
      value={field.value ?? ''}
      autoComplete="phone"
      type={'phone'}
      fullWidth
      label={title}
      error={!!error}
      helperText={error?.message ?? description}
      onChange={e => field.onChange(e.target.value)}
    />
  )
}
