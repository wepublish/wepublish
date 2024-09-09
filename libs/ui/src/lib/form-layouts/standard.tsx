import {styled} from '@mui/material'
import {createTsForm} from '@ts-react/form'
import {PropsWithChildren} from 'react'
import {formMapping} from './form'

export const StandardFormWrapper = styled('form')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  justify-items: start;
`

function Form({children, onSubmit}: PropsWithChildren<{onSubmit: () => void}>) {
  return <StandardFormWrapper onSubmit={onSubmit}>{children}</StandardFormWrapper>
}

export const StandardForm = createTsForm(formMapping, {
  FormComponent: Form
})
