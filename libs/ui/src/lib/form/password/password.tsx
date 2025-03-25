import {InputAdornment} from '@mui/material'
import {TextField} from '../../text-field/text-field'
import {useReducer} from 'react'
import {IconButton} from '../../icon-button/icon-button'
import {MdVisibility, MdVisibilityOff} from 'react-icons/md'
import {InputComponentProps} from '@wepublish/website/form-builder'
import * as v from 'valibot'

export const PasswordInputSchema = v.pipe(v.string(), v.brand('password'))

export function PasswordInput({
  field,
  fieldState: {error},
  description,
  title = 'Password',
  name
}: InputComponentProps) {
  const [showPassword, togglePassword] = useReducer(state => !state, false)

  return (
    <TextField
      {...field}
      value={field.value ?? ''}
      onChange={e => field.onChange(e.target.value)}
      autoComplete="new-password"
      type={showPassword ? 'text' : 'password'}
      fullWidth
      label={title}
      error={!!error}
      helperText={error?.message ?? description}
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
