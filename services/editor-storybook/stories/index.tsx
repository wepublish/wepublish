import React from 'react'
import {storiesOf} from '@storybook/react'

export function Test() {
  return <div>Hello World</div>
}

storiesOf('Button', module).add('with text', () => <Test />, {info: {inline: true}})
