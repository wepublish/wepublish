import {styled} from '@mui/material'
import {Block, EmbedBlock as EmbedBlockType} from '@wepublish/website/api'
import {BuilderEmbedBlockProps} from '@wepublish/website/builder'
import {css} from '@emotion/react'
import {useMemo} from 'react'

export const isEmbedBlock = (block: Block): block is EmbedBlockType =>
  block.__typename === 'EmbedBlock'

export const EmbedBlockWrapper = styled('div')``

export const EmbedBlockIframe = styled('iframe')<{aspectRatio: number}>`
  width: 100%;
  border: 0;
  aspect-ratio: ${({aspectRatio}) => aspectRatio};
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
  const ratio = width && height ? width / height : 1

  const styleCustomCss = useMemo(
    () => css`
      ${styleCustom}
    `,
    [styleCustom]
  )

  return url ? (
    <EmbedBlockWrapper className={className}>
      <EmbedBlockIframe
        aspectRatio={ratio}
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
