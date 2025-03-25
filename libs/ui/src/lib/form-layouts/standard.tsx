import {PropsWithChildren} from 'react'
import {formMapping} from './form'
import styled from '@emotion/styled'
import {createFormLayout} from '@wepublish/website/form-builder'

export const StandardFormWrapper = styled('form')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  justify-items: start;
`

function Form({children, onSubmit}: PropsWithChildren<{onSubmit: () => void}>) {
  return <StandardFormWrapper onSubmit={onSubmit}>{children}</StandardFormWrapper>
}

export const StandardForm = createFormLayout(formMapping, {
  FormComponent: Form
})
