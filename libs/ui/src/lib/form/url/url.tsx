import {
  createUniqueFieldSchema,
  RTFSupportedZodTypes,
  useDescription,
  useTsController
} from '@ts-react/form'
import {z} from 'zod'

import {TextField} from '../../text-field/text-field'

const URL_BRANDING = 'url'

export const URLInputSchema = createUniqueFieldSchema(z.string().url(), URL_BRANDING)

export const createURLInputSchema = <T extends RTFSupportedZodTypes>(zodEffect: T) =>
  createUniqueFieldSchema(zodEffect.brand(URL_BRANDING), URL_BRANDING)

export function URLInput() {
  const {field, error} = useTsController<string>()
  const {label = 'URL', placeholder} = useDescription()

  return (
    <TextField
      {...field}
      value={field.value ?? ''}
      autoComplete="url"
      type={'url'}
      fullWidth
      label={label}
      error={!!error}
      helperText={error?.errorMessage ?? placeholder}
      onChange={e => field.onChange(e.target.value)}
    />
  )
}
