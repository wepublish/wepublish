import React from 'react'

import {storiesOf} from '@storybook/react'
import {centerLayoutDecorator} from '../.storybook/decorators'
import {TitleImageBlock} from './titleBlockImage'
import {mockTeaserImage} from '../.storybook/storiesMockData'

storiesOf('Blocks|TitleBlockImage*', module)
  .addDecorator(centerLayoutDecorator(0.6))
  .add('Default', () => <TitleImageBlock image={mockTeaserImage} width={900} height={600} />)
