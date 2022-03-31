import React from 'react'
import {transformCssStringToObject} from '../../utility'

export interface IframeEmbedProps {
  url?: string
  title?: string
  width?: number
  height?: number
  styleCustom?: string
  sandbox?: string
}

export function IframeEmbed({url, title, width, height, styleCustom, sandbox}: IframeEmbedProps) {
  const ratio = width !== undefined && height !== undefined ? width / height : 0
  const noRatio = !!styleCustom || ratio === 0
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
          paddingTop: `${noRatio || ratio === 0 ? '0' : (1 / ratio) * 100 + '%'}`,
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
          width="100%"
          height={height}
          sandbox={sandbox?.length !== 0 ? sandbox : undefined}
        />
      </div>
    </div>
  )
}
