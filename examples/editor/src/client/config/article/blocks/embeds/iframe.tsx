import React from 'react'
import {transformCssStringToObject} from '../../utility'

export interface IframeEmbedProps {
  url?: string
  title?: string
  width?: number
  height?: number
  styleCustom?: string
}

export function IframeEmbed({url, title, width, height, styleCustom}: IframeEmbedProps) {
  const ratio = width !== undefined && height !== undefined ? width / height : 0
  const noRatio = !!styleCustom && ratio === 0
  const styleCustomCss =
    noRatio && !!styleCustom && styleCustom !== ''
      ? transformCssStringToObject(styleCustom)
      : {
          width: '100%',
          height: '100%'
        }

  return (
    <div style={{width: '100%'}}>
      <div
        style={{
          position: 'relative',
          paddingTop: `${noRatio && ratio === 0 ? '0' : (1 / ratio) * 100 + '%'}`,
          minHeight: '45px'
        }}>
        <iframe
          src={url}
          title={title}
          style={{
            position: !noRatio ? 'absolute' : 'relative',
            top: 0,
            left: 0,
            ...styleCustomCss
          }}
          scrolling="no"
          frameBorder="0"
          allowFullScreen
        />
      </div>
    </div>
  )
}
