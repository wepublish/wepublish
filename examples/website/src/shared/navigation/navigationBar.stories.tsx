import React from 'react'
import {storiesOf} from '@storybook/react'
import {NavigationBar} from './navigationBar'
import {centerLayoutDecorator} from '../.storybook/decorators'
import {mockNavigationItems} from '../.storybook/storiesMockData'

storiesOf('Navigation|NavigationBar', module)
  .addDecorator(centerLayoutDecorator())
  .add('Default', () => (
    <NavigationBar itemsCategory={mockNavigationItems} itemsIntern={mockNavigationItems} />
  ))
