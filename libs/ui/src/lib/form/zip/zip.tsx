import * as v from 'valibot'

import {TextField} from '../../text-field/text-field'
import {InputComponentProps} from '@wepublish/website/form-builder'

export const ZIPInputSchema = v.pipe(
  v.string(),
  v.regex(/^\d{4}$/, 'ZIP must be 4 digits long'),
  v.brand('zip')
)

export function ZIPInput({
  field,
  fieldState: {error},
  description,
  title,
  name
}: InputComponentProps) {
  return (
    <TextField
      {...field}
      value={field.value ?? ''}
      autoComplete="zip"
      type={'zip'}
      label={title}
      error={!!error}
      helperText={error?.message ?? description}
      onChange={e => field.onChange(e.target.value)}
    />
  )
}
