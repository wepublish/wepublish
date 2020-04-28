import React from 'react'
import {cssRule, useStyle} from '@karma.run/react'

import {Color} from '../style/colors'
import {getHumanReadableTimePassed} from '../utility'
import {
  DefaultTeaserTitleStyle,
  PreTitleStyle,
  DefaultTeaserTitleSingleStyle
} from './defaultTeaser'
import {pxToRem, whenTablet} from '../style/helpers'
import {Link, Route} from '../route/routeContext'

type BreakingTeaserStyleProps = {readonly isSingle: boolean}

const BreakingTeaserStyle = cssRule(({isSingle}: BreakingTeaserStyleProps) => ({
  width: '100%',
  height: '100%',
  minHeight: pxToRem(500),
  padding: `${pxToRem(20)} ${pxToRem(50)}`,

  backgroundColor: Color.Black,
  color: Color.White,
  textAlign: 'center',
  transition: 'background-color 200ms ease',

  '&:hover': {
    backgroundColor: Color.PrimaryDark
  },

  ...whenTablet({
    minHeight: isSingle ? '45vw' : pxToRem(500)
  })
}))

const TeaserBreakingPreTitleStyle = cssRule({
  color: Color.HighlightSecondary
})

const TeaserBreakingLinkStyle = cssRule({
  height: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  flexDirection: 'column'
})

const TeaserBreakingTimeStyle = cssRule({
  fontSize: pxToRem(14)
})

export interface BreakingTeaserProps {
  readonly title: string
  readonly date: Date
  readonly isSingle?: boolean
  readonly route: Route
  readonly preTitle?: string
}

export function BreakingTeaser({
  preTitle = 'Breaking',
  title,
  date,
  isSingle = false,
  route
}: BreakingTeaserProps) {
  const css = useStyle({isSingle})

  return (
    <div className={css(BreakingTeaserStyle)}>
      <Link route={route} className={css(TeaserBreakingLinkStyle)}>
        <div className={css(PreTitleStyle, TeaserBreakingPreTitleStyle)}>{preTitle}</div>
        <h2
          className={css(
            DefaultTeaserTitleStyle,
            isSingle ? DefaultTeaserTitleSingleStyle : cssRule({})
          )}>
          {title}
        </h2>
        <div className={css(TeaserBreakingTimeStyle)}>{getHumanReadableTimePassed(date)}</div>
      </Link>
    </div>
  )
}
