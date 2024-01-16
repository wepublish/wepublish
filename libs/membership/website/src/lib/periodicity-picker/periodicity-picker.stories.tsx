import {ApolloError} from '@apollo/client'
import {css} from '@emotion/react'
import {action} from '@storybook/addon-actions'
import {Meta, StoryObj} from '@storybook/react'
import {PaymentPeriodicity} from '@wepublish/website/api'
import {useState} from 'react'
import {PeriodicityPicker} from './periodicity-picker'

export default {
  component: PeriodicityPicker,
  title: 'Components/PeriodicityPicker',
  render: function ControlledPeriodicityPicker(args) {
    const [value, setValue] = useState(args.value)

    return (
      <PeriodicityPicker
        {...args}
        value={value}
        onChange={periodicity => {
          args.onChange(periodicity)
          setValue(periodicity)
        }}
      />
    )
  }
} as Meta<typeof PeriodicityPicker>

export const Default: StoryObj<typeof PeriodicityPicker> = {
  args: {
    periodicities: [
      PaymentPeriodicity.Monthly,
      PaymentPeriodicity.Quarterly,
      PaymentPeriodicity.Biannual,
      PaymentPeriodicity.Yearly
    ],
    onChange: action('onChange')
  }
}

export const Selected = {
  ...Default,
  args: {
    ...Default.args,
    value: PaymentPeriodicity.Quarterly
  }
}

export const Single: StoryObj<typeof PeriodicityPicker> = {
  ...Default,
  args: {
    ...Default.args,
    periodicities: [PaymentPeriodicity.Monthly]
  }
}

export const WithLoading = {
  ...Default,
  args: {
    ...Default.args,
    data: null,
    loading: true
  }
}

export const WithError = {
  ...Default,
  args: {
    ...Default.args,
    data: null,
    error: new ApolloError({
      errorMessage: 'Foobar'
    })
  }
}

export const WithClassName = {
  ...Default,
  args: {
    ...Default.args,
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  ...Default,
  args: {
    ...Default.args,
    css: css`
      background-color: #eee;
    `
  }
}
