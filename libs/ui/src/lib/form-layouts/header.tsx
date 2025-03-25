import {ComponentProps, PropsWithChildren, useEffect} from 'react'
import {useForm} from 'react-hook-form'
import * as v from 'valibot'
import {formMapping} from './form'
import {createFormLayout} from '@wepublish/website/form-builder'
import styled from '@emotion/styled'
import {valibotResolver} from '@hookform/resolvers/valibot'

const HeaderFormWrapper = styled('form')`
  display: flex;
  justify-content: end;
  justify-items: end;
  flex-flow: row;
  gap: ${({theme}) => theme.spacing(2)};

  & > * {
    max-width: max-content;
    border-width: initial;
  }

  .MuiOutlinedInput-notchedOutline {
    border: 0;
  }
`

function Form({children, onSubmit}: PropsWithChildren<{onSubmit: () => void}>) {
  return <HeaderFormWrapper onSubmit={onSubmit}>{children}</HeaderFormWrapper>
}

const HeaderFormInternal = createFormLayout(formMapping, {
  FormComponent: Form
})

export function HeaderForm(props: Omit<ComponentProps<typeof HeaderFormInternal>, 'form'>) {
  const form = useForm<v.InferOutput<typeof props.schema>>({
    mode: 'onTouched',
    reValidateMode: 'onChange',
    resolver: valibotResolver(props.schema)
  })

  useEffect(() => {
    const subscription = form.watch(form.handleSubmit(props.onSubmit))

    return () => subscription.unsubscribe()
  }, [props.onSubmit, form, form.handleSubmit, form.watch])

  return <HeaderFormInternal {...props} form={form} />
}
