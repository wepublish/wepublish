import React from 'react'
import {storiesOf} from '@storybook/react'

import {NotFoundTemplate} from './notFoundTemplate'
import {mockNavigationItems} from '../.storybook/storiesMockData'
import {BaseTemplate} from './baseTemplate'

storiesOf('Templates|NotFoundTemplate', module).add('Default', () => (
  <BaseTemplate
    navigationItems={mockNavigationItems}
    headerNavigationItems={mockNavigationItems}
    footerNavigationItems={mockNavigationItems}
    imprintNavigationItems={mockNavigationItems}>
    <NotFoundTemplate />
  </BaseTemplate>
))
