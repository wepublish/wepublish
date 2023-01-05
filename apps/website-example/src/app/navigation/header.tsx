import React from 'react'

import {Link, PageRoute} from '../route/routeContext'
import {useStyle, cssRule} from '@karma.run/react'
import {Color} from '../style/colors'
import {Logo} from '../atoms/logo'
import {whenDesktop} from '../style/helpers'
import {NavigationItem} from '../types'

export interface HeaderStyleProps {
  readonly isMinimized: boolean
}

const HeaderStyle = cssRule(({isMinimized}: HeaderStyleProps) => ({
  display: 'flex',

  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',

  backgroundColor: Color.White,
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

export interface HeaderProps {
  readonly navigationItems: NavigationItem[]
  readonly isMinimized: boolean
}

export function Header({navigationItems, isMinimized}: HeaderProps) {
  const css = useStyle({isMinimized})

  return (
    <nav className={css(HeaderStyle)}>
      <div className={css(HeaderLogoStyle)}>
        <Link route={PageRoute.create({})}>
          <Logo />
        </Link>
      </div>
    </nav>
  )
}
