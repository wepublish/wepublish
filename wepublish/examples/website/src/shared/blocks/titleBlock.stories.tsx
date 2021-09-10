import React from 'react'

import {storiesOf} from '@storybook/react'
import {centerLayoutDecorator} from '../.storybook/decorators'
import {TitleBlock} from './titleBlock'
import {TeaserType, HeaderType} from '../types'

storiesOf('Blocks|TitleBlock*', module)
  .addDecorator(centerLayoutDecorator(0.8))
  .add('Default Header', () => (
    <TitleBlock
      type={HeaderType.Default}
      preTitle={'Classic'}
      title={'Freiheit fuer die Presse!'}
      lead={
        'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. '
      }
      publishDate={new Date()}
      showSocialMediaIcons={true}
    />
  ))
  .add('Default Header no extras', () => (
    <TitleBlock
      type={HeaderType.Default}
      title={'Freiheit fuer die Presse!'}
      lead={
        'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. '
      }
      showSocialMediaIcons={true}
    />
  ))
  .add('Breaking Header', () => (
    <TitleBlock
      type={HeaderType.Breaking}
      preTitle={'Breaking'}
      title={'Freiheit fuer die Presse!'}
      publishDate={new Date()}
      showSocialMediaIcons={true}
    />
  ))
  .add('Breaking Header no extras', () => (
    <TitleBlock
      type={HeaderType.Breaking}
      title={'Freiheit fuer die Presse!'}
      showSocialMediaIcons={true}
    />
  ))
  .add('Default in Article', () => (
    <TitleBlock
      type={HeaderType.Default}
      title={'Freiheit fuer die Presse!'}
      lead={
        'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. '
      }
    />
  ))
