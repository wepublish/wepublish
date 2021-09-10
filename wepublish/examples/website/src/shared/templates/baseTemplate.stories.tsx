import React from 'react'
import {storiesOf} from '@storybook/react'
import {BaseTemplate} from './baseTemplate'
import {mockNavigationItems} from '../.storybook/storiesMockData'
import {Loader} from '../atoms/loader'

storiesOf('Templates|BaseTemplate', module)
  .add('Empty', () => (
    <BaseTemplate
      navigationItems={mockNavigationItems}
      imprintNavigationItems={mockNavigationItems}
      headerNavigationItems={mockNavigationItems}
      footerNavigationItems={mockNavigationItems}></BaseTemplate>
  ))
  .add('Loader', () => (
    <BaseTemplate
      navigationItems={mockNavigationItems}
      imprintNavigationItems={mockNavigationItems}
      headerNavigationItems={mockNavigationItems}
      footerNavigationItems={mockNavigationItems}>
      <Loader text="Loading"></Loader>
    </BaseTemplate>
  ))
  .add('Scrolling', () => (
    <BaseTemplate
      navigationItems={mockNavigationItems}
      imprintNavigationItems={mockNavigationItems}
      headerNavigationItems={mockNavigationItems}
      footerNavigationItems={mockNavigationItems}>
      <div
        style={{
          height: '3000px',
          background: 'linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.5))'
        }}
      />
    </BaseTemplate>
  ))
