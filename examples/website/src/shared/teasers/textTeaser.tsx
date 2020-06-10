import React from 'react'
import {Peer} from '../types'
import {Link, Route, AuthorRoute} from '../route/routeContext'
import {TagList} from '../atoms/tagList'
import {cssRule, useStyle} from '@karma.run/react'
import {Author} from '../types'
import {getHumanReadableTimePassed} from '../utility'
import {pxToRem, hexToRgb, whenTablet} from '../style/helpers'
import {Color} from '../style/colors'
import {
  DefaultTeaserTitleStyle,
  TeaserLinkStyling,
  PreTitleStyle,
  TeaserTextStyling,
  DefaultTeaserTitleSingleStyle
} from './defaultTeaser'

type TextTeaserStyleProps = {
  readonly isSingle?: boolean
}

export const TextTeaserStyle = cssRule(({isSingle}: TextTeaserStyleProps) => ({
  width: '100%',
  padding: `${pxToRem(20)} ${pxToRem(50)}`,
  transition: 'box-shadow 200ms ease;',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  minHeight: pxToRem(500),
  height: '100%',

  '&::after': {
    content: '""',
    zIndex: -1,
    opacity: 0,
    pointerEvents: 'none',
    position: 'absolute',
    width: '100%',
    height: '40%',
    bottom: 0,
    left: 0,
    background: `linear-gradient(to bottom, rgba(${hexToRgb(Color.Primary)},0) 0%,rgba(${hexToRgb(
      Color.Primary
    )},0.45) 100%)`,
    transform: 'translate3d(0,100px,0)',
    transition: 'opacity 200ms ease, transform 200ms ease'
  },

  ':hover::after': {
    transform: 'translate3d(0,0,0)',
    opacity: 1
  },

  ...whenTablet({
    minHeight: isSingle ? '45vw' : pxToRem(500)
  })
}))

export interface TextTeaserProps {
  readonly title: string
  readonly lead: string
  readonly authors?: Author[]
  readonly preTitle?: string
  readonly date: Date
  readonly peer?: Peer
  readonly tags: string[]
  readonly isSingle?: boolean
  readonly route: Route
}

export function TextTeaser({
  title,
  lead,
  authors,
  date,
  peer,
  tags,
  isSingle,
  route,
  preTitle
}: TextTeaserProps) {
  const css = useStyle({isSingle})

  return (
    <div className={css(TextTeaserStyle)}>
      <span className={css(PreTitleStyle)}>{preTitle}</span>
      <Link route={route}>
        <h2
          className={css(
            DefaultTeaserTitleStyle,
            isSingle ? DefaultTeaserTitleSingleStyle : cssRule({})
          )}>
          {title}
        </h2>
        <div className={css(TeaserTextStyling)}>{lead}</div>
      </Link>
      <div className={css(TeaserLinkStyling)}>
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
          </>
        )}
        {getHumanReadableTimePassed(date)}
      </div>
      <TagList peer={peer} tags={tags}></TagList>
    </div>
  )
}
