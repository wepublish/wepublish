import React from 'react'
import {cssRule, useStyle} from '@karma.run/react'
import {Color} from '../style/colors'
import {pxToRem, whenTablet, whenDesktop} from '../style/helpers'
import {Node} from 'slate'
import {RichTextBlock} from './richTextBlock/richTextBlock'
import {ImageData} from '../types'
import {RatioImage} from '../atoms/ratioImage'
import {usePermanentVisibility} from '../utils/hooks'

const ListicalWrapperStyle = cssRule<{showBackground: boolean}>(({showBackground}) => ({
  opacity: showBackground ? 1 : 0,
  transform: showBackground ? 'translate3d(0, 0, 0)' : 'translate3d(0, 100px, 0)',
  transition: 'opacity 500ms ease, transform 700ms ease'
}))

export const ListicalItemStyle = cssRule<{showBackground: boolean}>(({showBackground}) => ({
  borderBottom: `1px solid ${Color.Secondary}`,
  margin: `0 auto ${pxToRem(50)}`,

  ':last-child': {
    borderBottom: 0
  }
}))

export const ListicalItemInnerStyle = cssRule<{showBackground: boolean}>(({showBackground}) => ({
  ...whenDesktop({
    width: '50%'
  }),

  ...whenTablet({
    margin: `0 auto ${pxToRem(70)}`,
    width: '75%',
    maxWidth: pxToRem(1000)
  }),

  ...whenDesktop({
    margin: `0 auto ${pxToRem(70)}`,
    width: '75%',
    maxWidth: pxToRem(1000)
  })
}))

const ListicalNumberStyle = cssRule(() => ({
  backgroundColor: Color.PrimaryLight,
  borderRadius: '100%',
  width: pxToRem(45),
  height: pxToRem(45),
  color: Color.HighlightSecondary,
  textAlign: 'center',
  lineHeight: pxToRem(45),
  fontSize: pxToRem(24),
  margin: `0 auto ${pxToRem(15)}`,

  ...whenTablet({
    width: pxToRem(60),
    height: pxToRem(60),
    lineHeight: pxToRem(60)
  }),

  ...whenDesktop({
    width: pxToRem(60),
    height: pxToRem(60),
    lineHeight: pxToRem(60)
  })
}))

const ListicalTitleStyle = cssRule({
  fontSize: pxToRem(30),
  lineHeight: '1.2em',
  fontWeight: 'normal',
  margin: `0 0 ${pxToRem(25)}`,
  textAlign: 'center',

  ...whenTablet({
    fontSize: pxToRem(55)
  }),

  ...whenDesktop({
    fontSize: pxToRem(55)
  })
})

const ListicalTextStyle = cssRule({
  fontSize: pxToRem(15),
  lineHeight: '1.5em',
  padding: `0 ${pxToRem(25)}`,
  margin: `0 auto ${pxToRem(25)}`,

  ...whenTablet({
    fontSize: pxToRem(17),
    width: '100%',
    maxWidth: pxToRem(900)
  }),

  ...whenDesktop({
    fontSize: pxToRem(17),
    width: '66.66%',
    maxWidth: pxToRem(900)
  })
})

const ListicalImageStyle = cssRule({
  margin: `0 auto ${pxToRem(25)}`,

  ...whenDesktop({
    width: '80%'
  })
})

export type ListicalItem = {
  readonly title: string
  readonly image?: ImageData
  readonly text?: Node[]
}

export interface ListicalBLockProps {
  listical: Array<ListicalItem>
}

export function ListicalBLock({listical}: ListicalBLockProps) {
  const ref = React.createRef<HTMLParagraphElement>()
  const show = usePermanentVisibility(ref, {threshold: 0})
  const css = useStyle({showBackground: show})

  return (
    <div ref={ref} className={css(ListicalWrapperStyle)}>
      {listical.map((item, index) => (
        <div key={index} className={css(ListicalItemStyle)}>
          <div className={css(ListicalItemInnerStyle)}>
            <div className={css(ListicalNumberStyle)}>{index + 1}</div>
            <h2 className={css(ListicalTitleStyle)}>{item.title}</h2>
            {item.image && (
              <div className={css(ListicalImageStyle)}>
                <RatioImage
                  src={item.image.format === 'gif' ? item.image.url : item.image.largeURL}
                  alt={item.image.description || item.image.caption}
                  width={690}
                  height={414}
                />
              </div>
            )}
            {item.text && (
              <div className={css(ListicalTextStyle)}>
                <RichTextBlock
                  displayOnly
                  disabled
                  value={item.text}
                  onChange={() => {
                    /* do nothing */
                  }}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
