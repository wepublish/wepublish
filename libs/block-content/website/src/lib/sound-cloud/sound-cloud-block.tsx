import styled from '@emotion/styled';
import {
  FullBlockFragment,
  FullSoundCloudTrackBlockFragment,
} from '@wepublish/website/api';
import { BuilderSoundCloudTrackBlockProps } from '@wepublish/website/builder';

export const isSoundCloudTrackBlock = (
  block: Partial<Pick<FullBlockFragment, '__typename'>>
): block is FullSoundCloudTrackBlockFragment =>
  block.__typename === 'SoundCloudTrackBlock';

export const SoundCloudTrackBlockWrapper = styled('div')``;

export const SoundCloudTrackBlockPlayer = styled('iframe')`
  width: 100%;
  height: 300px;
  border: 0;
`;

export const SoundCloudTrackBlock = ({
  trackID,
  className,
}: BuilderSoundCloudTrackBlockProps) => (
  <SoundCloudTrackBlockWrapper className={className}>
    <SoundCloudTrackBlockPlayer
      src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(
        `https://api.soundcloud.com/tracks/${trackID}`
      )}&visual=true`}
      title="Embedded SoundCloud Track"
      allow="autoplay"
    />
  </SoundCloudTrackBlockWrapper>
);
