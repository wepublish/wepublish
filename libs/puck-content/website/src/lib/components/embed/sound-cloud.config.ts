import { ComponentConfig } from '@puckeditor/core';
import {
  BuilderSoundCloudTrackBlockProps,
  SoundCloudTrackBlock,
} from '@wepublish/website/builder';

import { UserFields } from '../../types';

export const SoundCloudConfig: ComponentConfig<{
  props: BuilderSoundCloudTrackBlockProps;
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'Embeds a SoundCloud audio player. Set trackID to the numeric SoundCloud track identifier (found in the embed code as "api.soundcloud.com/tracks/trackID"), not the track URL.',
  },
  fields: {
    trackID: {
      type: 'text',
      label: 'Track ID',
    },
  },
  defaultProps: {},

  render: SoundCloudTrackBlock,
};
