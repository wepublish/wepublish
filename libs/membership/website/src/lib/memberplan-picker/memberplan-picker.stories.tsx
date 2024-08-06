import {css} from '@emotion/react'
import {action} from '@storybook/addon-actions'
import {Meta, StoryObj} from '@storybook/react'
import {Currency, Exact, FullImageFragment, FullMemberPlanFragment} from '@wepublish/website/api'
import {useState} from 'react'
import {Node} from 'slate'
import {MemberPlanPicker} from './memberplan-picker'
import {ApolloError} from '@apollo/client'

export default {
  component: MemberPlanPicker,
  title: 'Components/MemberPlanPicker',
  render: function ControlledMemberPlanPicker(args) {
    const [value, setValue] = useState(args.value)

    return (
      <MemberPlanPicker
        {...args}
        value={value}
        onChange={memberPlanId => {
          args.onChange(memberPlanId)
          setValue(memberPlanId)
        }}
      />
    )
  }
} as Meta<typeof MemberPlanPicker>

const image = {
  __typename: 'Image',
  id: 'ljh9FHAvHAs0AxC',
  mimeType: 'image/jpg',
  format: 'jpg',
  createdAt: '2023-04-18T12:38:56.369Z',
  modifiedAt: '2023-04-18T12:38:56.371Z',
  filename: 'DSC07717',
  extension: '.JPG',
  width: 4000,
  height: 6000,
  fileSize: 8667448,
  description: null,
  tags: [],
  source: null,
  link: null,
  license: null,
  focalPoint: {
    x: 0.5,
    y: 0.5
  },
  title: null,
  url: 'https://unsplash.it/500/281',
  bigURL: 'https://unsplash.it/800/400',
  largeURL: 'https://unsplash.it/500/300',
  mediumURL: 'https://unsplash.it/300/200',
  smallURL: 'https://unsplash.it/200/100',
  squareBigURL: 'https://unsplash.it/800/800',
  squareLargeURL: 'https://unsplash.it/500/500',
  squareMediumURL: 'https://unsplash.it/300/300',
  squareSmallURL: 'https://unsplash.it/200/200'
} as FullImageFragment

const text = [
  {
    type: 'paragraph',
    children: [
      {
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
      }
    ]
  }
] as Node[]

const memberPlan = {
  __typename: 'MemberPlan',
  image,
  name: 'Foobar Memberplan',
  amountPerMonthMin: 5000,
  availablePaymentMethods: [],
  id: '123',
  slug: '',
  description: text,
  tags: [],
  currency: Currency.Chf,
  extendable: true
} as Exact<FullMemberPlanFragment>

export const Default: StoryObj<typeof MemberPlanPicker> = {
  args: {
    memberPlans: [
      memberPlan,
      {...memberPlan, id: '2', currency: Currency.Eur},
      {...memberPlan, id: '3'}
    ],
    onChange: action('onChange')
  }
}

export const Selected = {
  ...Default,
  args: {
    ...Default.args,
    value: memberPlan.id
  }
}

export const Single: StoryObj<typeof MemberPlanPicker> = {
  ...Default,
  args: {
    ...Default.args,
    memberPlans: [memberPlan]
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
