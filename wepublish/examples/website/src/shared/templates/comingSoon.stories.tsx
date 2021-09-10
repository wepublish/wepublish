import React from 'react'
import {storiesOf} from '@storybook/react'

import {mockNavigationItems} from '../.storybook/storiesMockData'
import {BaseTemplate} from './baseTemplate'
import {ComingSoon} from './comingSoon'

storiesOf('Templates|ComingSoon', module).add('Default', () => (
  <BaseTemplate
    navigationItems={mockNavigationItems}
    headerNavigationItems={mockNavigationItems}
    footerNavigationItems={mockNavigationItems}
    imprintNavigationItems={mockNavigationItems}>
    <ComingSoon />
  </BaseTemplate>
))
