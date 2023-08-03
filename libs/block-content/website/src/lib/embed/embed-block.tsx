import {styled} from '@mui/material'
import {Block, EmbedBlock as EmbedBlockType} from '@wepublish/website/api'
import {BuilderEmbedBlockProps} from '@wepublish/website/builder'
import {css} from '@emotion/react'
import {useMemo} from 'react'

export const isEmbedBlock = (block: Block): block is EmbedBlockType =>
  block.__typename === 'EmbedBlock'

export const EmbedBlockWrapper = styled('div')``

export const EmbedBlockIframe = styled('iframe')`
  border: 0;
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
  const ratio = width && height ? width / height : 0

  const styleCustomCss = useMemo(
    () => css`
      width: 100%;
      aspect-ratio: ${ratio || 1};
      ${styleCustom}
    `,
    [styleCustom, ratio]
  )

  return url ? (
    <EmbedBlockWrapper className={className}>
      <EmbedBlockIframe
        css={styleCustomCss}
        src={url}
        title={title ?? undefined}
        allowFullScreen
        sandbox={sandbox ?? undefined}
      />
    </EmbedBlockWrapper>
  ) : (
    <div></div>
  )
}
