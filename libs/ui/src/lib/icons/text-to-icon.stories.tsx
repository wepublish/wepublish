import {Stack} from '@mui/material'
import {Meta, StoryObj} from '@storybook/react'

import {TextToIcon} from './text-to-icon'

export default {
  component: TextToIcon,
  title: 'UI/Icons/TextToIcon',
  render: () => (
    <Stack gap={1} alignItems={'start'}>
      <span>
        <TextToIcon title="x" size={22} /> x{' '}
      </span>
      <span>
        <TextToIcon title="tiktok" size={22} /> tiktok{' '}
      </span>
      <span>
        <TextToIcon title="facebook" size={22} /> facebook{' '}
      </span>
      <span>
        <TextToIcon title="instagram" size={22} /> instagram{' '}
      </span>
      <span>
        <TextToIcon title="linkedin" size={22} /> linkedin{' '}
      </span>
      <span>
        <TextToIcon title="bluesky" size={22} /> x{' '}
      </span>
      <span>
        <TextToIcon title="github" size={22} /> x{' '}
      </span>
      <span>
        <TextToIcon title="reddit" size={22} /> x{' '}
      </span>
      <span>
        <TextToIcon title="spotify" size={22} /> x{' '}
      </span>
      <span>
        <TextToIcon title="amazon" size={22} /> x{' '}
      </span>
      <span>
        <TextToIcon title="vimeo" size={22} /> x{' '}
      </span>
      <span>
        <TextToIcon title="discord" size={22} /> x{' '}
      </span>
      <span>
        <TextToIcon title="strava" size={22} /> x{' '}
      </span>
      <span>
        <TextToIcon title="mail" size={22} /> mail{' '}
      </span>
      <span>
        <TextToIcon title="website" size={22} /> website{' '}
      </span>
      <span>
        <TextToIcon title="trustj" size={22} /> trustj{' '}
      </span>
      <span>
        <TextToIcon title="search" size={22} /> search{' '}
      </span>
    </Stack>
  )
} as Meta<typeof TextToIcon>

export const Default: StoryObj<typeof TextToIcon> = {}

export const ExtraSpellings: StoryObj<typeof TextToIcon> = {
  render: () => (
    <Stack gap={1} alignItems={'start'}>
      <span>
        <TextToIcon title="x" size={22} /> x
      </span>
      <span>
        <TextToIcon title="twitter" size={22} /> twitter
      </span>

      <span>
        <TextToIcon title="mail" size={22} /> mail
      </span>
      <span>
        <TextToIcon title="e-mail" size={22} /> e-mail
      </span>
      <span>
        <TextToIcon title="email" size={22} /> email
      </span>

      <span>
        <TextToIcon title="presseausweis" size={22} /> presseausweis
      </span>
      <span>
        <TextToIcon title="trustj" size={22} /> trustj
      </span>

      <span>
        <TextToIcon title="search" size={22} /> search
      </span>
      <span>
        <TextToIcon title="suche" size={22} /> suche
      </span>
    </Stack>
  )
}
