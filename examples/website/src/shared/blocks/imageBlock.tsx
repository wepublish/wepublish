import React from 'react'
import {ImageFit} from '../atoms/image'
import {useStyle, cssRule} from '@karma.run/react'
import {pxToRem, whenTablet, whenDesktop} from '../style/helpers'
import {RatioImage} from '../atoms/ratioImage'
import {usePermanentVisibility} from '../utils/hooks'

export interface ImageBlockProps {
  readonly src: string
  readonly height: number
  readonly width: number
  readonly description?: string
  readonly caption?: string
  readonly author?: string
}

const ImageBlockStyle = cssRule<{showBackground: boolean}>(({showBackground}) => ({
  maxWidth: pxToRem(1600),
  margin: `0 auto ${pxToRem(50)}`,
  textAlign: 'center',
  fontSize: pxToRem(14),
  opacity: showBackground ? 1 : 0,
  transform: showBackground ? 'translate3d(0, 0, 0)' : 'translate3d(0, 100px, 0)',
  transition: 'opacity 500ms ease, transform 700ms ease',

  ...whenTablet({
    margin: `0 auto ${pxToRem(70)}`
  }),

  ...whenDesktop({
    margin: `0 auto ${pxToRem(70)}`
  })
}))

const ImageBlockCaptionStyle = cssRule({
  padding: `0 ${pxToRem(25)}`
})

export function ImageBlock(props: ImageBlockProps) {
  const ref = React.createRef<HTMLParagraphElement>()
  const show = usePermanentVisibility(ref, {threshold: 0})
  const css = useStyle({showBackground: show})

  return (
    <div ref={ref} className={css(ImageBlockStyle)}>
      <RatioImage
        src={props.src}
        alt={props.description || props.caption}
        height={props.height}
        width={props.width}
        fit={ImageFit.Contain}
      />
      {(props.author || props.caption) && (
        <p className={css(ImageBlockCaptionStyle)}>
          {props.caption} {props.author ? <>(Foto: {props.author})</> : null}
        </p>
      )}
    </div>
  )
}
