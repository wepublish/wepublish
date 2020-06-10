import React from 'react'
import {Peer} from '../types'
import {Image} from '../atoms/image'
import {PrimaryButton} from '../atoms/primaryButton'
import {cssRule, useStyle} from '@karma.run/react'
import {Color} from '../style/colors'
import {pxToRem, whenMobile} from '../style/helpers'
import {Link} from '../route/routeContext'

export const CalloutBreakStyle = cssRule(isArticle => ({
  backgroundColor: Color.SecondaryLight,
  padding: `${pxToRem(25)} ${pxToRem(125)}`,
  margin: isArticle && `0 auto ${pxToRem(70)}`,
  borderTop: `1px solid ${Color.Secondary}`,
  borderBottom: isArticle ? `1px solid ${Color.Secondary}` : `1px solid ${Color.Primary}`,

  ...whenMobile({
    padding: pxToRem(25)
  })
}))

const CalloutBreakInnerStyle = cssRule({
  maxWidth: pxToRem(1600),
  margin: '0 auto',
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'row',
  justifyContent: 'space-between',

  ...whenMobile({
    flexDirection: 'column'
  })
})

const CalloutBreakImageStyle = cssRule({
  width: pxToRem(90),
  height: pxToRem(90),
  borderRadius: '50%',
  border: `1px solid ${Color.Black}`,
  overflow: 'hidden'
})

const CalloutBreakTextStyle = cssRule({
  width: '100%',
  fontSize: pxToRem(35),
  textAlign: 'center',
  margin: `${pxToRem(15)} 0`
})

const CalloutBreakButton = cssRule({
  fontSize: pxToRem(12)
})

export interface CalloutBreakBlockStyleProps {
  isArticle?: boolean
}
export interface CalloutBreakBlockProps {
  peer?: Peer
  text: string
  linkURL: string
  linkText: string
  linkExternal: boolean
  bgImage: string
  bgColor: string
  bgStyle: string
}

export function CalloutBreakBlock({
  peer,
  text,
  linkURL,
  linkText,
  linkExternal,
  bgImage,
  bgColor,
  bgStyle,
  isArticle = false
}: CalloutBreakBlockProps & CalloutBreakBlockStyleProps) {
  const css = useStyle(isArticle)
  return (
    <div className={css(CalloutBreakStyle)}>
      <div className={css(CalloutBreakInnerStyle)}>
        {peer && (
          <div className={css(CalloutBreakImageStyle)}>
            <Image src={peer.logoURL} height={90} width={90} />
          </div>
        )}
        <p className={css(CalloutBreakTextStyle)}>{text}</p>
        {linkText && linkURL && (
          <Link
            className={css(CalloutBreakButton)}
            href={linkURL}
            target={linkExternal ? '_blank' : '_self'}>
            <PrimaryButton text={linkText}></PrimaryButton>
          </Link>
        )}
        {bgImage}
        {bgStyle}
        {bgColor}
      </div>
    </div>
  )
}
