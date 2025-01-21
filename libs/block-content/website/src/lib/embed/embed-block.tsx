import styled from '@emotion/styled'
import {Block, EmbedBlock as EmbedBlockType} from '@wepublish/website/api'
import {BuilderEmbedBlockProps} from '@wepublish/website/builder'
import {css} from '@emotion/react'
import {useMemo} from 'react'
import IframeResizer from 'iframe-resizer-react'

export const isEmbedBlock = (block: Block): block is EmbedBlockType =>
  block.__typename === 'EmbedBlock'

export const EmbedBlockWrapper = styled('div')``

export const EmbedBlockIframe = styled(IframeResizer, {
  shouldForwardProp: propName => propName !== 'aspectRatio'
})<{aspectRatio: number | null}>`
  width: 100%;
  border: 0;

  ${({aspectRatio}) =>
    aspectRatio &&
    css`
      aspect-ratio: ${aspectRatio};
    `}
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
  const ratio = width && height ? width / height : null

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
        sandbox={sandbox || undefined}
      />
    </EmbedBlockWrapper>
  ) : (
    <div></div>
  )
}
