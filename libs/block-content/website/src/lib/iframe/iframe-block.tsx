import {styled} from '@mui/material'
import {BlockContent, IFrameBlock as IFrameBlockType} from '@wepublish/website/api'
import {BuilderIFrameBlockProps} from '@wepublish/website/builder'
import {css} from '@emotion/react'
import {useMemo} from 'react'
import IframeResizer from 'iframe-resizer-react'

export const isIFrameBlock = (block: Pick<BlockContent, '__typename'>): block is IFrameBlockType =>
  block.__typename === 'IFrameBlock'

export const IFrameBlockWrapper = styled('div')``

export const IFrameBlockIframe = styled(IframeResizer, {
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

export function IFrameBlock({
  url,
  title,
  width,
  height,
  styleCustom,
  sandbox,
  className
}: BuilderIFrameBlockProps) {
  const ratio = width && height ? width / height : null

  const styleCustomCss = useMemo(
    () => css`
      ${styleCustom}
    `,
    [styleCustom]
  )

  return url ? (
    <IFrameBlockWrapper className={className}>
      <IFrameBlockIframe
        aspectRatio={ratio}
        css={styleCustomCss}
        src={url}
        title={title ?? undefined}
        allowFullScreen
        sandbox={sandbox || undefined}
      />
    </IFrameBlockWrapper>
  ) : (
    <div></div>
  )
}
