import React from 'react'
import {ImageFit} from '../atoms/image'
import {Peer} from '../types'
import {Link, Route, AuthorRoute} from '../route/routeContext'
import {TagList} from '../atoms/tagList'
import {cssRule, useStyle} from '@karma.run/react'
import {ImageData, Author} from '../types'
import {getHumanReadableTimePassed} from '../utility'
import {BlockIcon, IconType} from '../atoms/icon'
import {pxToRem, hexToRgb, whenTablet, whenDesktop} from '../style/helpers'
import {Color} from '../style/colors'
import {RatioImage} from '../atoms/ratioImage'

export const DefaultTeaserStyle = cssRule({
  width: '100%',
  minHeight: '100%',
  padding: `${pxToRem(20)} ${pxToRem(25)}`,
  transition: 'box-shadow 200ms ease;',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',

  // ':hover': {
  //   boxShadow: `inset 0 0 5em ${Color.Primary}`,
  // },

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
    padding: `${pxToRem(20)} ${pxToRem(50)}`
  }),

  ...whenDesktop({
    padding: `${pxToRem(20)} ${pxToRem(50)}`
  })
})

export const PreTitleStyle = cssRule({
  color: Color.Primary,
  textAlign: 'center',
  display: 'block',
  marginBottom: pxToRem(15),
  fontSize: pxToRem(16),
  fontWeight: 'bold'
})

export const DefaultTeaserImageStyle = cssRule({
  fill: Color.White,
  position: 'relative',
  transition: 'fill 200ms ease',
  maxWidth: pxToRem(500),
  margin: `0 auto ${pxToRem(25)}`,

  '&:hover': {
    fill: Color.Highlight
  }
})

const DefaultTeaserImageSingleStyle = cssRule({
  ...whenTablet({
    maxWidth: '50%'
  })
})

export const DefaultTeaserTitleStyle = cssRule({
  fontWeight: 300,
  textAlign: 'center',
  fontSize: pxToRem(30),
  margin: `0 auto ${pxToRem(25)}`
})

export const DefaultTeaserTitleSingleStyle = cssRule({
  ...whenTablet({
    maxWidth: '75%'
  })
})

export const TeaserTextStyling = cssRule({
  fontSize: pxToRem(17),
  marginBottom: pxToRem(25),
  textAlign: 'center'
})

export const TeaserLinkStyling = cssRule({
  color: Color.Primary,
  textAlign: 'center',
  marginBottom: pxToRem(25),
  fontSize: pxToRem(14),

  '> a': {
    textDecoration: 'underline'
  }
})

export const TeaserTaskListStyles = cssRule({
  marginTop: 'auto'
})

const PlayStyle = cssRule({
  width: pxToRem(60),
  height: pxToRem(60),
  borderRadius: '100%',
  padding: '0.5em',
  backgroundColor: 'transparent',
  border: `1px solid ${Color.White}`,
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate3d(-50%,-50%,0)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
})

export interface DefaultTeaserProps {
  readonly title: string
  readonly preTitle?: string
  readonly image?: ImageData
  readonly lead?: string
  readonly authors?: Author[]
  readonly isUpdated?: boolean
  readonly date?: Date
  readonly peer?: Peer
  readonly tags: string[]
  readonly isVideo?: boolean
  readonly isSingle?: boolean
  readonly route: Route
}

// TODO solve link in link Problem for teasers
export function DefaultTeaser({
  image,
  preTitle,
  route,
  isSingle,
  isVideo,
  title,
  lead,
  authors,
  isUpdated = false,
  date,
  peer,
  tags
}: DefaultTeaserProps) {
  const css = useStyle()

  return (
    <div className={css(DefaultTeaserStyle)}>
      <Link route={route}>
        <div
          className={css(
            DefaultTeaserImageStyle,
            isSingle ? DefaultTeaserImageSingleStyle : cssRule({})
          )}>
          {image && (
            <RatioImage
              src={image && (image.format === 'gif' ? image.url : image.mediumTeaserURL)}
              width={570}
              height={380}
              fit={ImageFit.Cover}
              alt={image.description || image.caption}
            />
          )}
          {isVideo && (
            <div className={css(PlayStyle)}>
              <BlockIcon type={IconType.Play} />
            </div>
          )}
        </div>
        <span className={css(PreTitleStyle)}>{preTitle}</span>
        <h2
          className={css(
            DefaultTeaserTitleStyle,
            isSingle ? DefaultTeaserTitleSingleStyle : cssRule({})
          )}>
          {title}
        </h2>
        {lead && <div className={css(TeaserTextStyling)}>{lead}</div>}
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
            {/* authors.map(author => author.name).join(', ') */}
          </>
        )}
        {isUpdated && 'Aktualisiert '}
        {date && getHumanReadableTimePassed(date)}
      </div>
      <div className={css(TeaserTaskListStyles)}>
        <TagList peer={peer} tags={tags}></TagList>
      </div>
    </div>
  )
}
