import React from 'react'
import {cssRule, useStyle} from '@karma.run/react'
import {Color} from '../style/colors'
import {pxToRem, whenTablet, whenDesktop} from '../style/helpers'
import {ImageData, ImageRefData} from '../types'
import {ImageFit} from '../atoms/image'
import {RatioImage} from '../atoms/ratioImage'

import {usePermanentVisibility} from '../utils/hooks'

export const TitleBlockStyle = cssRule<{showBackground: boolean}>(({showBackground}) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  textAlign: 'center',
  marginBottom: pxToRem(50),
  opacity: showBackground ? 1 : 0,
  transform: showBackground ? 'translate3d(0, 0, 0)' : 'translate3d(0, 100px, 0)',
  transition: 'opacity 500ms ease, transform 700ms ease',

  ...whenTablet({
    marginBottom: pxToRem(70)
  }),

  ...whenDesktop({
    marginBottom: pxToRem(70)
  })
}))

const ImageStyle = cssRule({
  backgroundColor: Color.SecondaryLight,
  padding: pxToRem(25),

  '> img': {
    width: '100%',
    maxHeight: pxToRem(800),
    maxWidth: pxToRem(1600),
    margin: '0 auto'
  }
})

export interface TitleImageBlockProps {
  readonly image?: ImageData
  readonly imageRef?: ImageRefData
  readonly width: number
  readonly height: number
}

export function TitleImageBlock({image, imageRef, width, height}: TitleImageBlockProps) {
  const ref = React.createRef<HTMLDivElement>()
  const show = usePermanentVisibility(ref, {threshold: 0})
  const css = useStyle({showBackground: show})

  return (
    <div ref={ref} className={css(TitleBlockStyle)}>
      <div className={css(ImageStyle)}>
        {image && (
          <RatioImage
            src={image.format === 'gif' ? image.url : image.largeURL}
            fit={ImageFit.Cover}
            width={width}
            height={height}
            alt={image.description || image.caption}
          />
        )}
        {!image && imageRef && (
          <RatioImage
            src={imageRef.extension === '.gif' ? imageRef.url : imageRef.largeURL}
            fit={ImageFit.Cover}
            width={width}
            height={height}
            alt={imageRef.description || imageRef.title}
          />
        )}
      </div>
    </div>
  )
}
