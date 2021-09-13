import React from 'react'
import {cssRule, useStyle} from '@karma.run/react'
import {Color} from '../style/colors'
import {pxToRem, whenTablet, whenDesktop} from '../style/helpers'
import {HeaderType, Author} from '../types'
import {TitleBlockBreaking} from './titleBlockBreaking'
import {getHumanReadableTimePassed} from '../utility'
import {usePermanentVisibility} from '../utils/hooks'
import {MobileSocialMediaButtons} from '../atoms/socialMediaButtons'
import {Link, AuthorRoute} from '../route/routeContext'

export const TitleBlockStyle = cssRule<{showBackground: boolean}>(({showBackground}) => ({
  paddingTop: pxToRem(30),
  paddingBottom: pxToRem(40),
  marginBottom: pxToRem(70),
  borderBottom: `1px solid ${Color.Secondary}`,
  opacity: showBackground ? 1 : 0,
  transform: showBackground ? 'translate3d(0, 0, 0)' : 'translate3d(0, 100px, 0)',
  transition: 'opacity 500ms ease, transform 700ms ease'
}))

export const TitleInnerBlockStyle = cssRule(() => ({
  textAlign: 'center',
  maxWidth: pxToRem(1200),
  margin: `0 auto`,
  padding: `0 ${pxToRem(25)}`,
  width: '100%',

  ...whenDesktop({
    width: '75%'
  })
}))

const PreTitleStyle = cssRule({
  color: Color.PrimaryLight,
  fontSize: pxToRem(18),

  marginTop: 0,
  marginBottom: pxToRem(20),

  ...whenTablet({
    fontSize: pxToRem(24)
  }),

  ...whenDesktop({
    fontSize: pxToRem(24)
  })
})

const TitleStyle = cssRule({
  fontWeight: 'normal',
  fontSize: pxToRem(30),
  marginTop: 0,
  marginBottom: '3rem',

  ...whenTablet({
    fontSize: pxToRem(55)
  }),

  ...whenDesktop({
    fontSize: pxToRem(55)
  })
})

const TextStyle = cssRule({
  fontWeight: 'normal',
  fontSize: pxToRem(18),
  marginTop: 0,
  marginBottom: '1em',

  ...whenTablet({
    fontSize: pxToRem(24)
  }),

  ...whenDesktop({
    fontSize: pxToRem(24)
  })
})

const AuthorContainerStyle = cssRule({
  color: Color.PrimaryLight,
  fontSize: pxToRem(14),

  '> a': {
    textDecoration: 'underline',
    transition: 'color 200ms ease',

    '&:hover': {
      color: Color.Black
    }
  }
})

export interface TitleBlockDefaultProps {
  preTitle?: string
  title: string
  lead?: string
  authors?: Author[]
  publishedAt?: Date
  updatedAt?: Date
  showSocialMediaIcons?: boolean
  shareUrl: string
  isPeerArticle: boolean
}

export function TitleBlock({type, ...props}: TitleBlockDefaultProps & {type: HeaderType}) {
  switch (type) {
    default:
    case HeaderType.Default:
      return <TitleBlockDefault {...props} />

    case HeaderType.Breaking:
      return <TitleBlockBreaking {...props} />
  }
}

export function TitleBlockDefault({
  preTitle,
  title,
  lead,
  authors,
  publishedAt,
  updatedAt,
  showSocialMediaIcons = false,
  shareUrl,
  isPeerArticle
}: TitleBlockDefaultProps) {
  const ref = React.createRef<HTMLParagraphElement>()
  const show = usePermanentVisibility(ref, {threshold: 0})
  const css = useStyle({showBackground: show})

  const showUpdatedAt = publishedAt?.getTime() != updatedAt?.getTime()

  return (
    <div ref={ref} className={css(TitleBlockStyle)}>
      <div className={css(TitleInnerBlockStyle)}>
        {preTitle && <p className={css(PreTitleStyle)}>{preTitle}</p>}
        <h1 className={css(TitleStyle)}>{title}</h1>
        {lead && <p className={css(TextStyle)}>{lead}</p>}
        <p className={css(AuthorContainerStyle)}>
          {/* TODO: List Authros <Link href="#">{author}</Link> — Basel vor 1 Stunde */}
          {authors && authors.length !== 0 && (
            <>
              {/* TODO create author routes */}
              {authors
                .map<React.ReactNode>(author =>
                  isPeerArticle ? (
                    <Link key={author.id} href={author.url}>
                      {author.name}
                    </Link>
                  ) : (
                    <Link
                      key={author.id}
                      route={AuthorRoute.create({id: author.slug || author.id})}>
                      {author.name}
                    </Link>
                  )
                )
                .reduce((prev, curr) => [prev, ', ', curr])}
              {' — '}
              {/* authors.map(author => author.name).join(', ') */}
            </>
          )}
          {publishedAt && getHumanReadableTimePassed(publishedAt)}
        </p>
        <p className={css(AuthorContainerStyle)}>
          {showUpdatedAt && updatedAt && <>Aktualisiert {getHumanReadableTimePassed(updatedAt)}</>}
        </p>
      </div>

      {showSocialMediaIcons && <MobileSocialMediaButtons shareUrl={shareUrl} />}
    </div>
  )
}
