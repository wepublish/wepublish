import React from 'react'

import {Link, PageRoute, useRoute} from '../route/routeContext'
import {useStyle, cssRule} from '@karma.run/react'
import {Color} from '../style/colors'
import {Logo} from '../atoms/logo'
import {whenDesktop, hexToRgb} from '../style/helpers'
import {NavigationItem} from '../types'
import {PODCAST_SLUG} from '../utility'

export interface HeaderStyleProps {
  readonly isMinimized: boolean
}

const HeaderStyle = cssRule(({isMinimized}: HeaderStyleProps) => ({
  display: 'flex',

  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',

  backgroundColor: Color.White,
  boxShadow: isMinimized ? 'none' : `0 0 25px rgba(${hexToRgb(Color.Primary)}, 0.6)`,
  borderBottom: isMinimized ? `1px solid ${Color.Secondary}` : 'none',
  textTransform: 'uppercase',
  fontSize: '14px',

  ...whenDesktop({
    height: '140px',
    flexDirection: 'row',
    alignItems: 'flex-end'
  })
}))

const HeaderLogoStyle = cssRule(({isMinimized}: HeaderStyleProps) => ({
  fill: Color.NeutralDark,
  width: '30%',
  padding: '10px 0',
  display: 'flex',
  justifyContent: 'center',
  zIndex: 1,

  '> a > svg': {
    height: '5rem',
    transition: 'transform 200ms ease, fill 200ms ease'
  },

  '>a:hover > svg': {
    fill: Color.PrimaryDark
  },

  ...whenDesktop({
    order: 2,

    '> a > svg': {
      height: '123px',
      transform: isMinimized ? 'translateY(50px) scale(0.25)' : 'translateY(25px)'
    }
  })
}))

const HeaderStartNavigation = cssRule(() => ({
  ...whenDesktop({
    order: 1,
    justifyContent: 'flex-end',
    paddingRight: '25px',
    position: 'relative',
    height: '50px',

    '::after': {
      content: '" "',
      position: 'absolute',
      top: '-1px',
      left: '50%',
      height: '1px',
      width: '50vw',
      backgroundColor: Color.Secondary
    }
  })
}))

const HeaderEndNavigation = cssRule(() => ({
  ...whenDesktop({
    order: 3,
    justifyContent: 'flex-start',
    paddingLeft: '25px'
  })
}))

const HeaderNavigationStyles = cssRule({
  display: 'flex',
  justifyContent: 'space-evenly',
  width: '100%',
  padding: '15px 0',
  borderTop: `1px solid ${Color.Secondary}`,

  ...whenDesktop({
    '> a': {
      padding: '0 10px',
      transition: 'color 200ms ease',

      '&:hover': {
        color: Color.PrimaryDark
      }
    }
  })
})

export interface HeaderProps {
  readonly navigationItems: NavigationItem[]
  readonly isMinimized: boolean
}

export function Header({navigationItems, isMinimized}: HeaderProps) {
  const css = useStyle({isMinimized})
  const {current} = useRoute()

  const navigationElements = navigationItems.map(({title, route}) => (
    <Link className={css()} key={title} route={route}>
      {title}
    </Link>
  ))

  const startNavigationElements = navigationElements.slice(
    0,
    Math.ceil(navigationElements.length / 2)
  )

  const endNavigationElements = navigationElements.slice(Math.ceil(navigationElements.length / 2))

  return (
    <nav className={css(HeaderStyle)}>
      <div className={css(HeaderLogoStyle)}>
        <Link route={PageRoute.create({})}>
          <Logo />
        </Link>
      </div>
      <div className={css(HeaderNavigationStyles, HeaderStartNavigation)}>
        <Link route={PageRoute.create({slug: PODCAST_SLUG})}>Piepston</Link>
        <Link route={{...current!, query: {modal: 'briefingarchiv'}}}>Basel Briefing</Link>
        {startNavigationElements}
      </div>
      <div className={css(HeaderNavigationStyles, HeaderEndNavigation)}>
        {endNavigationElements}
        <Link route={{...current!, query: {modal: 'memberwerden'}}}>Member werden</Link>
      </div>
    </nav>
  )
}
