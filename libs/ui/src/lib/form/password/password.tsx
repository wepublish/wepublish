import {InputAdornment} from '@mui/material'
import {TextField} from '../../text-field/text-field'
import {useReducer} from 'react'
import {createUniqueFieldSchema, useDescription, useTsController} from '@ts-react/form'
import {z} from 'zod'
import {IconButton} from '../../icon-button/icon-button'
import {MdVisibility, MdVisibilityOff} from 'react-icons/md'

export const PasswordInputSchema = createUniqueFieldSchema(z.string(), 'password')

export function PasswordInput() {
  const {field, error} = useTsController<string>()
  const {label = 'Password', placeholder} = useDescription()

  const [showPassword, togglePassword] = useReducer(state => !state, false)

  return (
    <TextField
      {...field}
      value={field.value ?? ''}
      onChange={e => field.onChange(e.target.value)}
      autoComplete="new-password"
      type={showPassword ? 'text' : 'password'}
      fullWidth
      label={label}
      error={!!error}
      helperText={error?.errorMessage ?? placeholder}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              onClick={togglePassword}
              onMouseDown={event => event.preventDefault()}
              edge="end">
              {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
            </IconButton>
          </InputAdornment>
        )
      }}
    />
  )
}
