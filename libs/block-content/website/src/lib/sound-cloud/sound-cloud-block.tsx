import styled from '@emotion/styled';
import {
  BlockContent,
  SoundCloudTrackBlock as SoundCloudTrackBlockType,
} from '@wepublish/website/api';
import { BuilderSoundCloudTrackBlockProps } from '@wepublish/website/builder';
import ReactPlayer from 'react-player';

export const isSoundCloudTrackBlock = (
  block: Pick<BlockContent, '__typename'>
): block is SoundCloudTrackBlockType =>
  block.__typename === 'SoundCloudTrackBlock';

export const SoundCloudTrackBlockWrapper = styled('div')``;

export const SoundCloudTrackBlockPlayer = styled(ReactPlayer)`
  width: 100%;
  aspect-ratio: 16/9;
`;

export const SoundCloudTrackBlock = ({
  trackID,
  className,
}: BuilderSoundCloudTrackBlockProps) => (
  <SoundCloudTrackBlockWrapper className={className}>
    <SoundCloudTrackBlockPlayer
      width={'auto'}
      height={'auto'}
      url={`https://api.soundcloud.com/tracks/${trackID}`}
      controls={true}
    />
  </SoundCloudTrackBlockWrapper>
);
