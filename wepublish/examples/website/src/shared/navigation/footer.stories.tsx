import React from 'react'
import {storiesOf} from '@storybook/react'
import {Footer} from './footer'

storiesOf('Navigation|Footer', module).add('Default', () => (
  <Footer text="Hat Dir der Artikel gefallen?" />
))
