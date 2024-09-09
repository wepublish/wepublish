import {
  createUniqueFieldSchema,
  useDescription,
  useFieldInfo,
  useTsController
} from '@ts-react/form'

import {Autocomplete, CircularProgress} from '@mui/material'
import {useEffect, useMemo, useState} from 'react'
import {z} from 'zod'
import {deepUnwrap, isArray} from '../../form/hooks'
import {TextField} from '../../text-field/text-field'

const ARTICLE_BRANDING = 'article'
export const ArticleInputSchema = createUniqueFieldSchema(z.string(), ARTICLE_BRANDING)
export const ArticleArrayInputSchema = createUniqueFieldSchema(
  z.array(z.string()),
  ARTICLE_BRANDING
)

type Option = {label: string; value: string}

export function ArticleInput() {
  const {field, error} = useTsController<string | string[]>()
  const {label = 'Article', placeholder} = useDescription()

  const {zodType} = useFieldInfo()
  const allowMultiple = useMemo(() => isArray(deepUnwrap(zodType)), [zodType])

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
      : options.find(({value}) => field.value?.includes(value))
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
          label={label}
          error={!!error}
          helperText={error?.errorMessage ?? placeholder}
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
