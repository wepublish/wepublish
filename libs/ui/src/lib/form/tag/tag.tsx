import * as v from 'valibot'

import {Autocomplete} from '@mui/material'
import {useMemo} from 'react'
import {TextField} from '../../text-field/text-field'
import {InputComponentProps} from '@wepublish/website/form-builder'

const TAG_BRANDING = 'tag'
export const TagInputSchema = v.pipe(v.array(v.string()), v.brand(TAG_BRANDING))

export function TagInput({
  field,
  fieldState: {error},
  description,
  title,
  name,
  items
}: InputComponentProps<typeof TagInputSchema> & {items?: {value: string; label: string}[]}) {
  // const enums = useExtractEnumValues() @TODO:
  const enums = [] as any[]

  const options = useMemo(
    () => items ?? enums?.map(val => ({value: val, label: val})) ?? [],
    [enums, items]
  )

  const value = useMemo(() => {
    return options.filter(({value}) => field.value?.includes(value))
  }, [field.value, options])

  return (
    <Autocomplete
      multiple
      fullWidth
      value={value}
      options={options}
      getOptionLabel={option => option.label}
      onChange={(_e, newValue) => field.onChange(newValue.map(({value}) => value))}
      renderInput={params => (
        <TextField
          {...params}
          label={title}
          error={!!error}
          helperText={error?.message ?? description}
        />
      )}
    />
  )
}
