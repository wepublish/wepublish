import {styled} from '@mui/material'
import {Block, EmbedBlock as EmbedBlockType} from '@wepublish/website/api'
import {BuilderEmbedBlockProps} from '@wepublish/website/builder'

export const isEmbedBlock = (block: Block): block is EmbedBlockType =>
  block.__typename === 'EmbedBlock'

export const EmbedBlockWrapper = styled('div')`
  width: 100%;
`

export function EmbedBlock({
  url,
  title,
  width,
  height,
  styleCustom,
  sandbox,
  className
}: BuilderEmbedBlockProps) {
  return url ? (
    <EmbedBlockWrapper className={className}>
      <iframe src={url} title={title ?? undefined} allowFullScreen sandbox={sandbox ?? undefined} />
    </EmbedBlockWrapper>
  ) : (
    <div></div>
  )
}
