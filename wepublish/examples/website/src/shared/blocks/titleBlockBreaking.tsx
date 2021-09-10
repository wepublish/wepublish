import React from 'react'
import {cssRule, useStyle} from '@karma.run/react'
import {Color} from '../style/colors'
import {pxToRem, whenTablet, whenDesktop} from '../style/helpers'
import {TitleBlockDefaultProps} from './titleBlock'
import {getHumanReadableTimePassed} from '../utility'
import {usePermanentVisibility} from '../utils/hooks'
import {MobileSocialMediaButtons} from '../atoms/socialMediaButtons'

export const TitleBlockStyle = cssRule<{showBackground: boolean}>(({showBackground}) => ({
  backgroundColor: Color.Black,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: pxToRem(25),
  textAlign: 'center',
  minHeight: pxToRem(450),
  marginBottom: pxToRem(50),
  opacity: showBackground ? 1 : 0,
  transform: showBackground ? 'translate3d(0, 0, 0)' : 'translate3d(0, 100px, 0)',
  transition: 'opacity 500ms ease, transform 700ms ease',

  ...whenTablet({
    minHeight: pxToRem(780),
    marginBottom: pxToRem(70)
  }),

  ...whenDesktop({
    minHeight: pxToRem(780),
    marginBottom: pxToRem(70)
  })
}))

const TitleStyle = cssRule(() => ({
  fontWeight: 'normal',
  fontSize: pxToRem(30),
  marginTop: 0,
  marginBottom: '3rem',
  color: Color.White,

  ...whenTablet({
    fontSize: pxToRem(55)
  }),

  ...whenDesktop({
    fontSize: pxToRem(55)
  })
}))

const preTitleStyle = cssRule({
  color: Color.HighlightSecondary,
  fontSize: pxToRem(18),
  marginBottom: pxToRem(20),

  ...whenTablet({
    fontSize: pxToRem(24)
  }),

  ...whenDesktop({
    fontSize: pxToRem(24)
  })
})

const AuthorContainerStyle = cssRule({
  color: Color.White,
  fontSize: pxToRem(14),

  '> a': {
    textDecoration: 'underline',
    transition: 'color 200ms ease',

    '&:hover': {
      color: Color.Black
    }
  }
})

export interface TitleBlockBreakingProps extends TitleBlockDefaultProps {}

export function TitleBlockBreaking({
  preTitle,
  title,
  publishedAt,
  showSocialMediaIcons,
  shareUrl
}: TitleBlockBreakingProps) {
  const ref = React.createRef<HTMLParagraphElement>()
  const show = usePermanentVisibility(ref, {threshold: 0})
  const css = useStyle({showBackground: show})

  return (
    <div ref={ref} className={css(TitleBlockStyle)}>
      <p className={css(preTitleStyle)}>{preTitle && {preTitle}}</p>
      <h1 className={css(TitleStyle)}>{title}</h1>

      <p className={css(AuthorContainerStyle)}>
        {publishedAt && getHumanReadableTimePassed(publishedAt)}
      </p>

      {showSocialMediaIcons && <MobileSocialMediaButtons shareUrl={shareUrl} />}
    </div>
  )
}
