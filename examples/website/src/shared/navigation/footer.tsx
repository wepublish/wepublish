import React from 'react'
import {cssRule, useStyle} from '@karma.run/react'
import {Color} from '../style/colors'
import {SmallLogo} from '../atoms/logo'
import {pxToRem, whenDesktop} from '../style/helpers'
import {Link} from '../route/routeContext'
import {RoundIconButton} from '../atoms/roundIconButton'
import {IconType} from '../atoms/icon'
import {NavigationItem} from '../types'

export const FooterStyle = cssRule({
  overflow: 'hidden',
  backgroundColor: Color.SecondaryLight
})

export const FooterContentStyle = cssRule({
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'column',
  padding: `${pxToRem(32)} ${pxToRem(40)}`,

  ...whenDesktop({
    flexDirection: 'row'
  })
})

export const FooterLogoStyle = cssRule({
  fontSize: pxToRem(67),
  fill: Color.NeutralDark,
  order: 0,
  transform: 'none',

  '> svg': {
    height: '100%'
  },

  ...whenDesktop({
    marginBottom: 0,
    flexBasis: '5%',
    marginRight: pxToRem(30),
    fontSize: pxToRem(71),

    '> svg': {
      height: pxToRem(70)
    }
  })
})

export const FooterLogoContainerStyle = cssRule({
  display: 'flex',
  justifyContent: 'space-between',
  width: '100%',
  marginBottom: pxToRem(25),

  ...whenDesktop({
    display: 'block',
    width: 'auto',
    marginBottom: 0
  })
})

export const FooterAdressStyle = cssRule({
  margin: 0,
  textAlign: 'right',

  ...whenDesktop({
    display: 'none'
  })
})

export const FooterTextStyle = cssRule({
  textAlign: 'center',
  fontSize: pxToRem(35),
  marginBottom: pxToRem(30),
  lineHeight: '114%',
  order: 1,
  display: 'none',

  ...whenDesktop({
    marginBottom: 0,
    marginTop: 0,
    flexBasis: '50%',
    padding: `0 ${pxToRem(20)}`,
    order: 2,
    display: 'block'
  })
})

export const FooterShareStyle = cssRule({
  display: 'flex',
  fontSize: pxToRem(60),
  marginBottom: pxToRem(23),
  order: 2,

  '& > a': {
    margin: `0 ${pxToRem(9)}`
  },

  ...whenDesktop({
    fontSize: pxToRem(40),
    marginBottom: 0,
    flexBasis: '20%',
    order: 1
  })
})

export const FooterMoreButtonStyle = cssRule({
  fontSize: pxToRem(12),
  order: 3,

  ...whenDesktop({
    textAlign: 'right',
    flexBasis: '25%'
  })
})

export const FooterFootnoteStyle = cssRule({
  display: 'flex',
  justifyContent: 'center',
  flexWrap: 'wrap',

  fontSize: pxToRem(14),
  lineHeight: pxToRem(30),
  padding: `${pxToRem(10)} ${pxToRem(15)}`,

  color: Color.White,
  backgroundColor: Color.PrimaryDark,

  '& > a:first-child': {
    fontWeight: 'bold',
    textDecoration: 'none'
  },

  '& > a': {
    display: 'block',
    margin: `0 ${pxToRem(10)}`,
    textDecoration: 'underline'
  }
})

export interface FooterProps {
  text?: string
  navigation?: NavigationItem[]
  onNewsletter?(): void
}

export function Footer({text, navigation, onNewsletter}: FooterProps) {
  const css = useStyle()

  return (
    <footer className={css(FooterStyle)}>
      <div className={css(FooterContentStyle)}>
        <div className={css(FooterLogoContainerStyle)}>
          <div className={css(FooterLogoStyle)}>
            <SmallLogo />
          </div>
          <p className={css(FooterAdressStyle)}>
            <strong>wepublish</strong>
            <br />
            Teststrasse 26 <br />
            8000 Zürich <br />
            <br />
            <Link href="mailto:info@wepublish.ch">info@wepublish.ch</Link>
          </p>
        </div>
        <p className={css(FooterTextStyle)}>{text}</p>
        <div className={css(FooterShareStyle)}>
          <Link target="_blank" rel="noopener" href="https://www.facebook.com/wepublish">
            <RoundIconButton icon={IconType.Facebook}></RoundIconButton>
          </Link>
          <Link target="_blank" rel="noopener" href="https://twitter.com/wepublish">
            <RoundIconButton icon={IconType.Twitter}></RoundIconButton>
          </Link>
          <Link href="mailto:info@wepublish.ch">
            <RoundIconButton icon={IconType.Mail}></RoundIconButton>
          </Link>
        </div>
      </div>
    </footer>
  )
}
