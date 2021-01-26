import React from 'react'
import {cssRule, useStyle} from '@karma.run/react'
import {Peer, ImageData, Author} from '../types'

import {Image, ImageFit} from '../atoms/image'
import {Link, Route, AuthorRoute} from '../route/routeContext'
import {TagList} from '../atoms/tagList'

import {getHumanReadableTimePassed} from '../utility'
import {pxToRem, hexToRgb, whenTablet} from '../style/helpers'
import {
  DefaultTeaserTitleStyle,
  TeaserLinkStyling,
  PreTitleStyle,
  DefaultTeaserTitleSingleStyle,
  TeaserTextStyling
} from './defaultTeaser'
import {Color} from '../style/colors'

type ImageTeaserStyleProps = {
  readonly isSingle: boolean
}

const ImageTeaserStyle = cssRule(({isSingle}: ImageTeaserStyleProps) => ({
  width: '100%',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  padding: `${pxToRem(25)} ${pxToRem(50)}`,
  minHeight: pxToRem(500),
  height: '100%',

  '&::after': {
    content: '" "',
    zIndex: -1,
    opacity: 0,
    pointerEvents: 'none',
    position: 'absolute',
    width: '100%',
    height: '40%',
    bottom: 0,
    left: 0,
    background: `linear-gradient(to bottom, rgba(${hexToRgb(Color.Primary)},0) 10%,rgba(${hexToRgb(
      Color.Primary
    )},0.45) 100%)`,
    transform: 'translate3d(0,100px,0)',
    transition: 'opacity 200ms ease, transform 200ms ease'
  },

  '&::before': {
    content: '" "',
    zIndex: -1,
    pointerEvents: 'none',
    position: 'absolute',
    width: '100%',
    height: '40%',
    bottom: 0,
    left: 0,
    background: 'linear-gradient(to bottom, rgba(0,0,0,0) 10%,rgba(0,0,0,0.45) 100%)'
  },

  '&:hover::after': {
    opacity: 1,
    transform: 'translate3d(0,0,0)'
  },

  ...whenTablet({
    minHeight: isSingle ? '45vw' : pxToRem(500)
  })
}))

const ImageTeaserPreTitleStyle = cssRule({
  marginBottom: 'auto'
})

const ImageTeaserTextStyling = cssRule({
  color: Color.White
})

const ImageTeaserImageStyle = cssRule({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  zIndex: -2,
  backgroundColor: Color.NeutralLight,

  '> img': {
    width: '100%',
    height: '100%'
  }
})

const TitleStyle = cssRule({
  color: Color.White
})

const ImageTeaserLinkStyle = cssRule({
  color: Color.HighlightSecondary
})

export interface LightTeaserProps {
  readonly title: string
  readonly image: ImageData
  readonly preTitle?: string
  readonly lead?: string
  readonly authors?: Author[]
  readonly date?: Date
  readonly peer?: Peer
  readonly tags: string[]
  readonly isSingle?: boolean
  readonly route: Route
}

export function ImageTeaser({
  isSingle = false,
  image,
  title,
  authors,
  peer,
  tags,
  date,
  lead,
  route,
  preTitle
}: LightTeaserProps) {
  const css = useStyle({isSingle})
  return (
    <div className={css(ImageTeaserStyle)}>
      <span className={css(PreTitleStyle, ImageTeaserPreTitleStyle)}>{preTitle}</span>
      <Link route={route}>
        <div className={css(ImageTeaserImageStyle)}>
          <Image
            src={
              image?.format === 'gif'
                ? image?.url
                : image?.largeURL || 'https://via.placeholder.com/240x240'
            }
            alt={image?.description || image?.caption}
            fit={ImageFit.Cover}
          />
        </div>
        <h2
          className={css(
            TitleStyle,
            DefaultTeaserTitleStyle,
            isSingle ? DefaultTeaserTitleSingleStyle : cssRule({})
          )}>
          {title}
        </h2>
      </Link>
      {lead && <div className={css(TeaserTextStyling, ImageTeaserTextStyling)}>{lead}</div>}
      <div className={css(TeaserLinkStyling, ImageTeaserLinkStyle)}>
        {authors && authors.length !== 0 && (
          <>
            {/* TODO create author routes */}
            {authors
              .map<React.ReactNode>(author =>
                peer ? (
                  <Link key={author.id} href={author.url}>
                    {author.name}
                  </Link>
                ) : (
                  <Link key={author.id} route={AuthorRoute.create({id: author.slug || author.id})}>
                    {author.name}
                  </Link>
                )
              )
              .reduce((prev, curr) => [prev, ', ', curr])}
            {' — '}
            {/* authors.map(author => author.name).join(', ') */}
          </>
        )}
        {date && getHumanReadableTimePassed(date)}
      </div>

      <TagList peer={peer} tags={tags}></TagList>
    </div>
  )
}
