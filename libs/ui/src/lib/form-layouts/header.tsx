import {styled} from '@mui/material'
import {createTsForm} from '@ts-react/form'
import {ComponentProps, PropsWithChildren, useEffect} from 'react'
import {zodResolver} from '@hookform/resolvers/zod'
import {useForm} from 'react-hook-form'
import {z} from 'zod'
import {formMapping} from './form'

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

const HeaderFormInternal = createTsForm(formMapping, {
  FormComponent: Form
})

export function HeaderForm(props: Omit<ComponentProps<typeof HeaderFormInternal>, 'form'>) {
  const form = useForm<z.infer<typeof props.schema>>({
    mode: 'onTouched',
    reValidateMode: 'onChange',
    resolver: zodResolver(props.schema)
  })

  useEffect(() => {
    const subscription = form.watch(form.handleSubmit(props.onSubmit))

    return () => subscription.unsubscribe()
  }, [props.onSubmit, form, form.handleSubmit, form.watch])

  return <HeaderFormInternal {...props} form={form} />
}
