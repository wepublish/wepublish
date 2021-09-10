import React from 'react'
import {storiesOf} from '@storybook/react'
import {InlineIcon, IconType} from './icon'
import {centerLayoutDecorator, fontSizeDecorator} from '../.storybook/decorators'

storiesOf('Atoms|Icon', module)
  .addDecorator(centerLayoutDecorator())
  .addDecorator(fontSizeDecorator(24))
  .add('All', () => (
    <>
      <InlineIcon type={IconType.Close} />
      <InlineIcon type={IconType.Hamburger} />
      <InlineIcon type={IconType.Search} />
      <InlineIcon type={IconType.Facebook} />
      <InlineIcon type={IconType.Twitter} />
      <InlineIcon type={IconType.Mail} />
      <InlineIcon type={IconType.Phone} />
      <InlineIcon type={IconType.Maximize} />
      <InlineIcon type={IconType.Minimize} />
      <InlineIcon type={IconType.Next} />
      <InlineIcon type={IconType.Previous} />
    </>
  ))
  .add('Close', () => <InlineIcon type={IconType.Close} />)
  .add('Hamburger', () => <InlineIcon type={IconType.Hamburger} />)
  .add('Search', () => <InlineIcon type={IconType.Search} />)
  .add('Search', () => <InlineIcon type={IconType.Search} />)
  .add('Facebook', () => <InlineIcon type={IconType.Facebook} />)
  .add('Twitter', () => <InlineIcon type={IconType.Twitter} />)
  .add('Mail', () => <InlineIcon type={IconType.Mail} />)
  .add('Phone', () => <InlineIcon type={IconType.Phone} />)
  .add('Maximize', () => <InlineIcon type={IconType.Maximize} />)
  .add('Minimize', () => <InlineIcon type={IconType.Minimize} />)
  .add('Next', () => <InlineIcon type={IconType.Next} />)
  .add('Previous', () => <InlineIcon type={IconType.Previous} />)
