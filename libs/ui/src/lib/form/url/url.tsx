import {TextField} from '../../text-field/text-field'
import {InputComponentProps} from '@wepublish/website/form-builder'
import * as v from 'valibot'

const URL_BRANDING = 'url'

export const URLInputSchema = v.pipe(v.string(), v.url(), v.brand(URL_BRANDING))

export function URLInput({
  field,
  fieldState: {error},
  description,
  title = 'URL',
  name
}: InputComponentProps) {
  return (
    <TextField
      {...field}
      value={field.value ?? ''}
      autoComplete="url"
      type={'url'}
      fullWidth
      label={title}
      error={!!error}
      helperText={error?.message ?? description}
      onChange={e => field.onChange(e.target.value)}
    />
  )
}
