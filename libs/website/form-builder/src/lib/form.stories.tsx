import * as v from 'valibot'
import {createFormLayout} from './create-form-layout'
import {StoryObj} from '@storybook/react'
import {TextField} from '@wepublish/ui'
import styled from '@emotion/styled'
import {action} from '@storybook/addon-actions'
import {FormSchemaMapping} from './utility/input-schema-mapping'

const testFormSchema: FormSchemaMapping = [
  [
    v.string(),
    (props: any) => (
      <TextField
        {...props.field}
        name={props.name}
        label={props.name}
        error={!!props.fieldState.error}
        helperText={props.fieldState.error?.message}
      />
    )
  ],
  [
    v.pipe(v.string(), v.brand('Email')),
    props => (
      <TextField
        {...props.field}
        type="email"
        name={props.name}
        label={props.title}
        error={!!props.fieldState.error}
        helperText={props.fieldState.error?.message ?? props.description}
      />
    )
  ],
  [
    v.number(),
    (props: any) => (
      <TextField
        {...props.field}
        type="number"
        name={props.name}
        label={props.name}
        error={!!props.fieldState.error}
        helperText={props.fieldState.error?.message}
      />
    )
  ]
] as const

const TestForm = styled.form`
  display: grid;
  gap: 12px;
`

const Result = createFormLayout(testFormSchema, {
  FormComponent: TestForm
})

export default {
  title: 'FormBuilder/Form',
  component: Result
}

export const Form: StoryObj<typeof Result> = {
  args: {
    renderAfter: () => <button type="submit">Submit</button>,
    formProps: {},
    inputProps: {
      email: {
        test: 'abc'
      }
    },
    defaultValues: {
      email: 'info@karl-merkli.ch'
    },
    schema: v.object({
      email: v.pipe(
        v.pipe(
          v.string(),
          v.email(),
          v.brand('Email'),
          v.title('Email'),
          v.description('Enter a valid email please!')
        ),
        v.title('Email2'),
        v.description('Enter an invalid email please!')
      ),
      number: v.pipe(v.string(), v.decimal(), v.transform(Number), v.maxValue(5))
    }),
    onSubmit: action('onSubmit')
  }
}
