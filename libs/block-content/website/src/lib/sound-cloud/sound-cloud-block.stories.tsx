import {Meta} from '@storybook/react'
import {SoundCloudTrackBlock} from './sound-cloud-block'
import {mockSoundCloudTrackBlock} from '@wepublish/storybook/mocks'

export default {
  component: SoundCloudTrackBlock,
  title: 'Blocks/SoundCloud'
} as Meta

export const Default = {
  args: mockSoundCloudTrackBlock()
}
