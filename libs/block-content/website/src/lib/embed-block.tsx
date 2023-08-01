import {styled} from '@mui/material'
import {Block, EmbedBlock as EmbedBlockType} from '@wepublish/website/api'
import {BuilderEmbedBlockProps} from '@wepublish/website/builder'

export function transformCssStringToObject(styleCustom: string): Record<string, unknown> {
  const styleRules = styleCustom.split(';')
  if (styleRules.length === 0) return {}
  return styleRules.reduce((previousValue: Record<string, unknown>, currentValue: string) => {
    const [key, value] = currentValue.split(':')
    if (key && value) {
      return Object.assign(previousValue, {[key.trim()]: value.trim()})
    }
    return previousValue
  }, {})
}

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
  const ratio = width && height ? width / height : 0
  const noRatio = !!styleCustom && ratio === 0
  const styleCustomCss =
    noRatio && !!styleCustom && styleCustom !== ''
      ? transformCssStringToObject(styleCustom)
      : {
          width: '100%',
          height: '100%'
        }

  return url ? (
    <EmbedBlockWrapper className={className}>
      <div
        style={{
          position: 'relative',
          paddingTop: `${noRatio && ratio === 0 ? '0' : (1 / ratio) * 100 + '%'}`,
          minHeight: '45px'
        }}>
        <iframe
          src={url}
          title={title ?? undefined}
          allowFullScreen
          sandbox={sandbox ?? undefined}
          style={{
            position: !noRatio ? 'absolute' : 'relative',
            top: 0,
            left: 0,
            ...styleCustomCss
          }}
        />
      </div>
    </EmbedBlockWrapper>
  ) : (
    <div></div>
  )
}
