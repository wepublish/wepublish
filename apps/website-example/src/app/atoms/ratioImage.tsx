import React from 'react'
import {useStyle, cssRule} from '@karma.run/react'
import {Color} from '../style/colors'
import {RatioContainer} from './ratioContainer'
import {ImageFit, Image} from './image'

const ImageBackgroundStyle = cssRule({
  backgroundColor: Color.NeutralLight,
  width: '100%',
  height: '100%'
})

export interface RatioImageProps {
  src: string
  width: number
  height: number
  fit?: ImageFit
  alt?: string
}

export function RatioImage({src, width, height, fit, alt}: RatioImageProps) {
  const css = useStyle()

  return (
    <RatioContainer aspectRatio={width / height}>
      <div className={css(ImageBackgroundStyle)}>
        <Image src={src} alt={alt} fit={fit} />
      </div>
    </RatioContainer>
  )
}
