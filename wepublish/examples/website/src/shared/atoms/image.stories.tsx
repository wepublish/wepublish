import React from 'react'
import {storiesOf} from '@storybook/react'
import {Image, ImageFit} from './image'
import {centerLayoutDecorator} from '../.storybook/decorators'

storiesOf('Atoms|Image', module)
  .addDecorator(centerLayoutDecorator(0.5))
  .add('Default', () => (
    <Image src="https://dummyimage.com/300x200/111333/0011ff" width={500} height={200} />
  ))
  .add('Contain', () => (
    <Image
      src="https://dummyimage.com/300x200/111333/0011ff"
      width={500}
      height={200}
      fit={ImageFit.Contain}
    />
  ))
  .add('Cover', () => (
    <Image
      src="https://dummyimage.com/300x200/111333/0011ff"
      width={500}
      height={200}
      fit={ImageFit.Cover}
    />
  ))
