import {createTsForm} from '@ts-react/form'
import {ComponentProps, PropsWithChildren} from 'react'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {useEffect} from 'react'
import {z} from 'zod'
import {baseFormMapping} from '../../form/form'
import {domainFormMapping} from '../form'

function Form({children}: PropsWithChildren<{onSubmit: () => void}>) {
  return <>{children}</>
}

const SubFormInternal = createTsForm([...baseFormMapping, ...domainFormMapping] as const, {
  FormComponent: Form
})

export function SubForm(props: Omit<ComponentProps<typeof SubFormInternal>, 'form'>) {
  const form = useForm<z.infer<typeof props.schema>>({
    mode: 'onTouched',
    reValidateMode: 'onChange',
    resolver: zodResolver(props.schema)
  })

  useEffect(() => {
    const subscription = form.watch(form.handleSubmit(props.onSubmit))

    return () => subscription.unsubscribe()
  }, [props.onSubmit, form, form.handleSubmit, form.watch])

  return <SubFormInternal {...props} form={form} />
}
