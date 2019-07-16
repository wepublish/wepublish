import React from 'react'
import {storiesOf} from '@storybook/react'
import {Button} from '@wepublish/react'

storiesOf('Button', module).add('with text', () => <Button text="123" />, {info: {inline: true}})
