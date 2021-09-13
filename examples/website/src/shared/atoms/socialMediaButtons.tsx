import React from 'react'
import {cssRule, useStyle} from '@karma.run/react'
import {pxToRem, whenDesktop, whenMobile, whenTablet} from '../style/helpers'
import {Link} from '../route/routeContext'
import {RoundIconButton} from './roundIconButton'
import {IconType} from './icon'

const MobileStyle = cssRule({
  fontSize: pxToRem(40),

  '& > a': {
    margin: `${pxToRem(9)} 0`
  },

  ...whenDesktop({
    display: 'none'
  }),

  ...whenTablet({
    display: 'none'
  }),

  ...whenMobile({
    display: 'flex',
    justifyContent: 'center'
  })
})

const MobileLinkStyle = cssRule({
  padding: `${pxToRem(25)} ${pxToRem(7)} 0`
})

/**
 * Desktop Social Media Buttons extra - see end of file
 */
export function MobileSocialMediaButtons({shareUrl: fbShareUrl}: SocialMediaButtonsProps) {
  const encodedUrl = encodeURIComponent(fbShareUrl)
  const css = useStyle()
  return (
    <div className={css(MobileStyle)}>
      <span className={css(MobileLinkStyle)}>
        <Link
          target="_blank"
          rel="noopener"
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          className="fb-xfbml-parse-ignore">
          <RoundIconButton icon={IconType.Facebook}></RoundIconButton>
        </Link>
      </span>
      <span className={css(MobileLinkStyle)}>
        <Link target="_blank" rel="noopener" href={`http://twitter.com/share?url=${encodedUrl}`}>
          <RoundIconButton icon={IconType.Twitter}></RoundIconButton>
        </Link>
      </span>
    </div>
  )
}

const DesktopStyle = cssRule({
  fontSize: pxToRem(40),
  position: 'sticky',
  top: '50%',
  height: 0,
  zIndex: 3,

  '& > a': {
    margin: `${pxToRem(9)} 0`
  },

  ...whenDesktop({}),

  ...whenMobile({
    display: 'none'
  })
})

const DesktopInnerStyle = cssRule({
  transform: 'translate3d(0,-50%,0)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  pointerEvents: 'none',
  padding: `0 ${pxToRem(45)}`
})

const DesktopLinkStyle = cssRule({
  pointerEvents: 'auto',
  marginBottom: pxToRem(15),

  '&:last-child': {
    marginBottom: 0
  }
})

export interface SocialMediaButtonsProps {
  readonly shareUrl: string
}

/**
 * Mobile Social Media Buttons extra - see top of file
 * @param param0
 */
export function DesktopSocialMediaButtons({shareUrl: fbShareUrl}: SocialMediaButtonsProps) {
  const css = useStyle()

  const encodedUrl = encodeURIComponent(fbShareUrl)

  return (
    <div className={css(DesktopStyle)}>
      <div className={css(DesktopInnerStyle)}>
        <span className={css(DesktopLinkStyle)}>
          <Link
            target="_blank"
            rel="noopener"
            href={`https://www.facebook.com/sharer/sharer.php?m2w&u=${encodedUrl}`}
            className="fb-xfbml-parse-ignore">
            <RoundIconButton icon={IconType.Facebook}></RoundIconButton>
          </Link>
        </span>
        <span className={css(DesktopLinkStyle)}>
          <Link target="_blank" rel="noopener" href={`http://twitter.com/share?url=${encodedUrl}`}>
            <RoundIconButton icon={IconType.Twitter}></RoundIconButton>
          </Link>
        </span>
      </div>
    </div>
  )
}
