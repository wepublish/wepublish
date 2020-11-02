import React from 'react'
import {Peer} from '../types'
import {Image} from '../atoms/image'
import {PrimaryButton} from '../atoms/primaryButton'
import {cssRule, useStyle} from '@karma.run/react'
import {Color} from '../style/colors'
import {pxToRem, whenMobile} from '../style/helpers'
import {Link} from '../route/routeContext'
import {RichTextBlockValue} from '@wepublish/editor/src/client/blocks/types'

export const PeerPageBreakStyle = cssRule(isArticle => ({
  backgroundColor: Color.SecondaryLight,
  padding: `${pxToRem(25)} ${pxToRem(125)}`,
  margin: isArticle && `0 auto ${pxToRem(70)}`,
  borderTop: `1px solid ${Color.Secondary}`,
  borderBottom: isArticle ? `1px solid ${Color.Secondary}` : `1px solid ${Color.Primary}`,

  ...whenMobile({
    padding: pxToRem(25)
  })
}))

const PeerPageBreakInnerStyle = cssRule({
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

const PeerPageBreakImageStyle = cssRule({
  width: pxToRem(90),
  height: pxToRem(90),
  borderRadius: '50%',
  border: `1px solid ${Color.Black}`,
  overflow: 'hidden'
})

const PeerPageBreakTextStyle = cssRule({
  width: '100%',
  fontSize: pxToRem(35),
  textAlign: 'center',
  margin: `${pxToRem(15)} 0`
})

const PeerPageBreakButton = cssRule({
  fontSize: pxToRem(12)
})

export interface PageBreakBlockStyleProps {
  isArticle?: boolean
}
export interface PageBreakBlockProps {
  peer?: Peer
  text: string
  richText: RichTextBlockValue
  linkURL: string
  linkText: string
  linkTarget: string
  styleOption: string
  templateOption: string
  layoutOption: string
  imageID: string
  image: null
}

export function PageBreakBlock({
  peer,
  text,
  richText,
  linkURL,
  linkText,
  linkTarget,
  styleOption,
  layoutOption,
  templateOption,
  imageID,
  image,
  isArticle = false
}: PageBreakBlockProps & PageBreakBlockStyleProps) {
  const css = useStyle(isArticle)
  return (
    <div className={css(PeerPageBreakStyle)}>
      <div className={css(PeerPageBreakInnerStyle)}>
        {peer && (
          <div className={css(PeerPageBreakImageStyle)}>
            <Image src={peer.logoURL} height={90} width={90} />
          </div>
        )}
        <pre>
          {{richText}}
          {{linkTarget}}
          {{layoutOption}}
          {{templateOption}}
          {{styleOption}}
          {{imageID}}
          {{image}}
        </pre>
        <p className={css(PeerPageBreakTextStyle)}>{text}</p>
        {linkText && linkURL && (
          <Link className={css(PeerPageBreakButton)} href={linkURL}>
            <PrimaryButton text={linkText}></PrimaryButton>
          </Link>
        )}
      </div>
    </div>
  )
}
