import * as v from 'valibot'

import {Rating} from '../../rating/rating'
import {FormControl, FormHelperText} from '@mui/material'
import {InputComponentProps} from '@wepublish/website/form-builder'

const RATING_BRANDING = 'rating'

export const RatingInputSchema = v.pipe(
  v.number(),
  v.minValue(1),
  v.maxValue(5),
  v.brand(RATING_BRANDING)
)

export function RatingInput({
  field,
  fieldState: {error},
  description,
  title,
  name,
  schema
}: InputComponentProps<typeof RatingInputSchema>) {
  const helperText = error?.message ?? description

  return (
    <FormControl fullWidth>
      {title && <label>{title}</label>}

      <Rating
        {...field}
        // max={maxValue} @TODO:
        value={field.value ?? 0}
        onChange={(_, value) => field.onChange(value ?? 1)}
      />

      {helperText && <FormHelperText error={!!error}>{helperText}</FormHelperText>}
    </FormControl>
  )
}
