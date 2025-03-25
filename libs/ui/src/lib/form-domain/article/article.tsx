import {Autocomplete, CircularProgress} from '@mui/material'
import {useEffect, useMemo, useState} from 'react'
import {TextField} from '../../text-field/text-field'
import * as v from 'valibot'
import {InputComponentProps, isArraySchema} from '@wepublish/website/form-builder'

const ARTICLE_BRANDING = 'article'
export const ArticleInputSchema = v.pipe(v.string(), v.brand(ARTICLE_BRANDING))
export const ArticleArrayInputSchema = v.pipe(v.array(v.string()), v.brand(ARTICLE_BRANDING))

type Option = {label: string; value: string}

export function ArticleInput({
  field,
  fieldState: {error},
  description,
  title = 'Article',
  name,
  schema
}: InputComponentProps<typeof ArticleInputSchema | typeof ArticleArrayInputSchema>) {
  const allowMultiple = isArraySchema(schema)

  const options = useMemo(
    () =>
      [
        {
          value: '1234',
          label: 'Die Gastgeber:innen der grössten Chilbi'
        },
        {
          value: '123',
          label: 'Mehrheit der Gemeinderät:innen wollen höheren Lohn'
        },
        {
          value: '124',
          label: 'Ungerechte Bildungschancen: Nun sind Lösungen gefragt'
        }
      ] as Option[],
    []
  )

  const value = useMemo(() => {
    return allowMultiple
      ? options.filter(({value}) => field.value?.includes(value))
      : options.find(({value}) => value === field.value)
  }, [allowMultiple, field.value, options])

  // Demo stuff
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 5000)

    return () => clearTimeout(timeout)
  }, [])

  return (
    <Autocomplete
      multiple={allowMultiple}
      fullWidth
      value={value ?? null}
      options={options}
      getOptionLabel={option => option.label}
      loading={loading}
      onChange={(_e, newValue) =>
        allowMultiple
          ? field.onChange((newValue as Option[])?.map(({value}) => value))
          : field.onChange((newValue as Option).value)
      }
      componentsProps={{
        paper: {
          sx: {
            width: '350px'
          }
        }
      }}
      renderInput={params => (
        <TextField
          {...params}
          label={title}
          error={!!error}
          helperText={error?.message ?? description}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            )
          }}
        />
      )}
    />
  )
}
