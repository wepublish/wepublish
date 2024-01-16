import {Meta} from '@storybook/react'
import {SoundCloudTrackBlock} from './sound-cloud-block'

export default {
  component: SoundCloudTrackBlock,
  title: 'Blocks/SoundCloud'
} as Meta

export const Default = {
  args: {
    trackID: '744469711'
  }
}

export const WithClassName = {
  args: {
    ...Default.args,
    className: 'extra-classname'
  }
}
