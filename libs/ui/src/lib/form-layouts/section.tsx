import {Card, CardContent, Typography} from '@mui/material'
import {ComponentProps, PropsWithChildren, useEffect, useReducer} from 'react'
import {useForm} from 'react-hook-form'
import * as v from 'valibot'
import {StandardFormWrapper} from './standard'
import {formMapping} from './form'
import styled from '@emotion/styled'
import {createFormLayout} from '@wepublish/website/form-builder'
import {valibotResolver} from '@hookform/resolvers/valibot'

const PartialFormWrapper = styled(StandardFormWrapper)``

function Form({title, children}: PropsWithChildren<{title?: string}>) {
  return (
    <Card variant="outlined">
      <CardContent>
        {title && (
          <Typography variant="h4" component={'p'} sx={{mb: 2}}>
            {title}
          </Typography>
        )}

        <PartialFormWrapper>{children}</PartialFormWrapper>
      </CardContent>
    </Card>
  )
}

const PartialFormInternal = createFormLayout(formMapping, {
  FormComponent: Form
})

function PartialForm(props: Omit<ComponentProps<typeof PartialFormInternal>, 'form'>) {
  const form = useForm<v.InferOutput<typeof props.schema>>({
    resolver: valibotResolver(props.schema)
  })

  useEffect(() => {
    const subscription = form.watch(form.handleSubmit(props.onSubmit))

    return () => subscription.unsubscribe()
  }, [props.onSubmit, form, form.handleSubmit, form.watch])

  return <PartialFormInternal {...props} form={form} />
}

const SectionFormWrapper = styled('div')`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: ${({theme}) => theme.spacing(4)};
  align-items: start;

  ${({theme}) => theme.breakpoints.up('sm')} {
    grid-template-columns: repeat(2, 1fr);
  }
`

export const SectionForm = <
  Section extends {
    title: string
  } & Omit<ComponentProps<typeof PartialFormInternal>, 'onSubmit'>,
  Sections extends readonly Section[],
  SectionData extends v.InferOutput<Section['schema']>,
  Data extends Array<SectionData | undefined>
>({
  sections
}: {
  sections: Sections
  onSubmit: (data: Data) => void
}) => {
  const [sectionData, setSectionData] = useReducer(
    (state: Data, action: {section: number; data: SectionData}) => {
      const newState = [...state] as Data
      newState[action.section] = action.data

      return newState
    },
    new Array(sections.length).fill(undefined) as Data
  )

  return (
    <SectionFormWrapper>
      {sections.map((section, index) => (
        <PartialForm
          key={section.title}
          {...section}
          formProps={{
            title: section.title
          }}
          onSubmit={data => setSectionData({section: index, data})}
        />
      ))}
    </SectionFormWrapper>
  )
}
