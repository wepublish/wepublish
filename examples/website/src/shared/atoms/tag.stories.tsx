import React from 'react'
import {storiesOf} from '@storybook/react'

import {Tag} from './tag'
import {Link, PageRoute} from '../route/routeContext'
import {fontSizeDecorator, centerLayoutDecorator} from '../.storybook/decorators'

storiesOf('Atoms|Tag', module)
  .addDecorator(centerLayoutDecorator())
  .addDecorator(fontSizeDecorator(11))
  .add('Text', () => <Tag title="Bajour" />)
  .add('Image & Text', () => <Tag title="Bajour" iconURL="https://dummyimage.com/32x32/000/fff" />)
  .add('Link', () => (
    <Link route={PageRoute.create({})}>
      <Tag title="Bajour" iconURL="https://dummyimage.com/32x32/000/fff" />
    </Link>
  ))
