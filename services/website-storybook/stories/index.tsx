import React from 'react'
import {storiesOf} from '@storybook/react'
import {Button} from '@wepublish/website/common'

storiesOf('Button', module).add('with text', () => <Button text="123" />, {info: {inline: true}})
