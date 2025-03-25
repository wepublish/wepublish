import {TextField} from '../../text-field/text-field'
import {InputComponentProps} from '@wepublish/website/form-builder'
import * as v from 'valibot'

const TEXTAREA_BRANDING = 'textarea'

export const TextareaInputSchema = v.pipe(v.string(), v.brand(TEXTAREA_BRANDING))

export function TextareaInput({
  field,
  fieldState: {error},
  description,
  title,
  name
}: InputComponentProps) {
  // const {maxLength} = useStringFieldInfo() // @TODO:
  const maxLength = undefined

  return (
    <TextField
      {...field}
      value={field.value ?? ''}
      multiline
      minRows={4}
      fullWidth
      label={title}
      error={!!error}
      helperText={[
        error?.message ?? description,
        maxLength && `${field.value?.length ?? 0}/${maxLength}`
      ]
        .filter(Boolean)
        .join(' - ')}
      onChange={e => field.onChange(e.target.value)}
    />
  )
}
