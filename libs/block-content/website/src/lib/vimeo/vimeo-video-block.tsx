import styled from '@emotion/styled'
import {useReadingList} from '@wepublish/reading-list/website'
import {BlockContent, VimeoVideoBlock as VimeoVideoBlockType} from '@wepublish/website/api'
import {BuilderVimeoVideoBlockProps} from '@wepublish/website/builder'
import ReactPlayer from 'react-player'

export const isVimeoVideoBlock = (
  block: Pick<BlockContent, '__typename'>
): block is VimeoVideoBlockType => block.__typename === 'VimeoVideoBlock'

export const VimeoVideoBlockWrapper = styled('div')``

export const VimeoVideoBlockPlayer = styled(ReactPlayer)`
  width: 100%;
  aspect-ratio: 16/9;
`
export function VimeoVideoBlock({videoID, className}: BuilderVimeoVideoBlockProps) {
  const [readingListProps] = useReadingList()

  return (
    <VimeoVideoBlockWrapper className={className} {...readingListProps}>
      <VimeoVideoBlockPlayer
        controls={true}
        url={`https://vimeo.com/${videoID}`}
        width="auto"
        height="auto"
      />
    </VimeoVideoBlockWrapper>
  )
}
