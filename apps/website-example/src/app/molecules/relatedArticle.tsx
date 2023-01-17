import React from 'react'
import {Peer, ImageData} from '../types'

import {Image, ImageFit} from '../atoms/image'
import {TagList} from '../atoms/tagList'
import {cssRule, useStyle} from '@karma.run/react'
import {pxToRem, whenTablet, whenDesktop} from '../style/helpers'
import {Color} from '../style/colors'

type RelatedArticleStyleProps = {readonly showImage: boolean}

export interface RelatedArticleProps {
  readonly text: string
  readonly peer?: Peer
  readonly tags: string[]
  readonly image: ImageData
  readonly showImage?: boolean
}

const RelatedArticleStyle = cssRule(({showImage}: RelatedArticleStyleProps) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
  minHeight: showImage ? 0 : pxToRem(270),
  padding: pxToRem(25),

  ...whenTablet({
    flexDirection: showImage ? 'row' : 'column',
    padding: showImage ? 0 : pxToRem(50)
  }),

  ...whenDesktop({
    flexDirection: showImage ? 'row' : 'column',
    padding: showImage ? 0 : pxToRem(50)
  })
}))

const RelatedArticleTextStyle = cssRule({
  fontWeight: 300,
  textAlign: 'center',
  fontSize: pxToRem(30),
  margin: `0 auto ${pxToRem(25)}`
})

const RelatedArticleTextWrapperStyle = cssRule(({showImage}: RelatedArticleStyleProps) => ({
  flex: showImage ? 1 : 0,
  padding: showImage ? pxToRem(25) : 0
}))

export const RelatedArticleImageStyle = cssRule({
  fill: Color.White,
  position: 'relative',
  transition: 'fill 200ms ease',
  maxWidth: pxToRem(500),
  marginBottom: pxToRem(15),

  ...whenTablet({
    width: '40%',
    marginBottom: 0
  }),

  ...whenDesktop({
    width: '40%',
    marginBottom: 0
  }),

  '&:hover': {
    fill: Color.Highlight
  },

  '& img': {
    maxHeight: pxToRem(300)
  }
})

export function RelatedArticle({text, peer, tags, image, showImage = false}: RelatedArticleProps) {
  const css = useStyle({showImage})
  return (
    <div className={css(RelatedArticleStyle)}>
      {showImage && image && (
        <div className={css(RelatedArticleImageStyle)}>
          <Image
            src={image.format === 'gif' ? image.url : image.mediumTeaserURL}
            width={image.width}
            height={image.height}
            alt={image.description}
            fit={ImageFit.Contain}
          />
        </div>
      )}
      <div className={css(RelatedArticleTextWrapperStyle)}>
        <p className={css(RelatedArticleTextStyle)}>{text}</p>
        <TagList peer={peer} tags={tags} />
      </div>
    </div>
  )
}
