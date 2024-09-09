import {
  createUniqueFieldSchema,
  RTFSupportedZodTypes,
  useDescription,
  useStringFieldInfo,
  useTsController
} from '@ts-react/form'

import {TextField} from '../../text-field/text-field'
import {z} from 'zod'

const TEXTAREA_BRANDING = 'textarea'

export const TextareaInputSchema = createUniqueFieldSchema(z.string(), TEXTAREA_BRANDING)

export const createTextareaInputSchema = <T extends RTFSupportedZodTypes>(zodEffect: T) =>
  createUniqueFieldSchema(zodEffect.brand(TEXTAREA_BRANDING), TEXTAREA_BRANDING)

export function TextareaInput() {
  const {field, error} = useTsController<string>()
  const {label, placeholder} = useDescription()
  const {maxLength} = useStringFieldInfo()

  return (
    <TextField
      {...field}
      value={field.value ?? ''}
      multiline
      minRows={4}
      fullWidth
      label={label}
      error={!!error}
      helperText={[
        error?.errorMessage ?? placeholder,
        maxLength && `${field.value?.length ?? 0}/${maxLength}`
      ]
        .filter(Boolean)
        .join(' - ')}
      onChange={e => field.onChange(e.target.value)}
    />
  )
}
