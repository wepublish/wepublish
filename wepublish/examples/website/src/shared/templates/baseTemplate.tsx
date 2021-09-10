import React, {ReactNode, useState} from 'react'
import {useStyle, cssRule, useEventListener} from '@karma.run/react'

import {Header} from '../navigation/header'
import {Footer} from '../navigation/footer'
import {pxToRem, whenDesktop, ZIndex, whenTablet, whenMobile} from '../style/helpers'
import {NavigationBar} from '../navigation/navigationBar'
import {NavigationItem} from '../types'

interface BaseTemplateStyleProps {
  readonly isHeaderMinimized: boolean
  readonly hideHeaderMobile: boolean
  readonly largeHeader: boolean
}

export const BaseTemplateStyle = cssRule({
  display: 'flex',
  flexDirection: 'column',

  width: '100%',
  minHeight: '100vh',

  ...whenDesktop({
    flexDirection: 'row'
  })
})

export const BaseTemplateNavStyle = cssRule({
  position: 'sticky',
  top: 0,
  zIndex: ZIndex.Navigation,

  height: pxToRem(60),

  ...whenDesktop({
    width: pxToRem(60),
    height: '100vh'
  })
})

export const BaseTemplateMainStyle = cssRule<BaseTemplateStyleProps>(({largeHeader}) => {
  return {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',

    ...whenDesktop({
      paddingTop: largeHeader ? '140px' : '50px'
    })
  }
})

export const BaseTemplateHeaderStyle = cssRule<BaseTemplateStyleProps>(
  ({isHeaderMinimized, hideHeaderMobile}) => ({
    zIndex: ZIndex.Header,

    ...whenDesktop({
      transition: 'transform 200ms',
      transform: isHeaderMinimized ? 'translateY(-93px)' : undefined,

      position: 'fixed',
      left: '60px',
      right: 0,
      top: 0
    }),

    ...whenTablet({
      display: hideHeaderMobile ? 'none' : undefined
    }),

    ...whenMobile({
      display: hideHeaderMobile ? 'none' : undefined
    })
  })
)

export const BaseTemplateContentStyle = cssRule({
  flexGrow: 1
})

export interface BaseTemplateProps {
  children?: ReactNode
  navigationItems: NavigationItem[]
  imprintNavigationItems: NavigationItem[]
  headerNavigationItems: NavigationItem[]
  footerNavigationItems: NavigationItem[]
  hideHeaderMobile?: boolean
  footerText?: string
  largeHeader?: boolean
}

export function BaseTemplate({
  children,
  navigationItems,
  headerNavigationItems,
  imprintNavigationItems,
  footerNavigationItems,
  largeHeader = false,
  hideHeaderMobile = false,
  footerText
}: BaseTemplateProps) {
  const [isHeaderMinimized, setHeaderMinimized] = useState(false)
  const [showNewsletterModal, setShowNewsletterModal] = useState(false)
  const css = useStyle({isHeaderMinimized, hideHeaderMobile, largeHeader, showNewsletterModal})

  useEventListener(
    () => [
      window,
      'scroll',
      (e: Event) => {
        if (window.scrollY > 140 && !isHeaderMinimized) {
          setHeaderMinimized(true)
        } else if (window.scrollY === 0 && isHeaderMinimized) {
          setHeaderMinimized(false)
        }
      }
    ],
    [isHeaderMinimized]
  )

  return (
    <div className={css(BaseTemplateStyle)}>
      <div className={css(BaseTemplateNavStyle)}>
        <NavigationBar itemsCategory={navigationItems} itemsIntern={imprintNavigationItems} />
      </div>
      <div className={css(BaseTemplateMainStyle)}>
        <div className={css(BaseTemplateHeaderStyle)}>
          <Header
            navigationItems={headerNavigationItems}
            isMinimized={largeHeader ? isHeaderMinimized : true}
          />
        </div>
        <div className={css(BaseTemplateContentStyle)}>{children}</div>
        <Footer
          text={footerText}
          navigation={footerNavigationItems}
          onNewsletter={() => setShowNewsletterModal(true)}
        />
      </div>
    </div>
  )
}
