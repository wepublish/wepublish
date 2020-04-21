import React from 'react'
import {storiesOf} from '@storybook/react'
import {boolean} from '@storybook/addon-knobs'

import {Header} from './header'
import {mockNavigationItems} from '../.storybook/storiesMockData'

storiesOf('Navigation|Header', module)
  .add('Expanded', () => <Header navigationItems={mockNavigationItems} isMinimized={false} />)
  .add('Minimized', () => <Header navigationItems={mockNavigationItems} isMinimized={true} />)
  .add('Animation', () => (
    <Header navigationItems={mockNavigationItems} isMinimized={boolean('isMinimized', false)} />
  ))
