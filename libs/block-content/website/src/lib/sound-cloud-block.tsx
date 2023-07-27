import styled from '@emotion/styled'
import {Block, SoundCloudTrackBlock as SoundCloudTrackBlockType} from '@wepublish/website/api'
import {BuilderSoundCloudTrackBlockProps} from '@wepublish/website/builder'

export const isSoundCloudTrackBlock = (block: Block): block is SoundCloudTrackBlockType =>
  block.__typename === 'SoundCloudTrackBlock'

export const SoundCloudTrackBlockWrapper = styled('div')``

export const SoundCloudTrackBlock = ({trackID, className}: BuilderSoundCloudTrackBlockProps) => (
  <SoundCloudTrackBlockWrapper className={className}></SoundCloudTrackBlockWrapper>
)
