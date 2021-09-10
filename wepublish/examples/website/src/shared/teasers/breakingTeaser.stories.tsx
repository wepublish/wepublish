import React from 'react'
import {storiesOf} from '@storybook/react'
import {BreakingTeaser} from './breakingTeaser'
import {PageRoute} from '../route/routeContext'

storiesOf('Teaser|BreakingTeaser*', module).add('Default', () => (
  <BreakingTeaser
    title="Eplosion in Kabul: Mindestens 14 Tote nach Anschlag"
    date={new Date()}
    route={PageRoute.create({})}
  />
))
