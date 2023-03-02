import React from 'react'
import {useStyle, cssRule} from '@karma.run/react'
import {pxToRem} from '../style/helpers'

const ComingSoonStyle = cssRule({
  padding: pxToRem(20),
  background:
    'radial-gradient(41.98% 88.17% at 50% 28.71%, rgba(255, 241, 234, 0.8) 0%, rgba(254, 221, 210, 0) 100%), #FFBBBB;',
  height: '100%'
})

export interface ComingSoonProps {}

export function ComingSoon({...props}: ComingSoonProps) {
  const css = useStyle()

  return <div className={css(ComingSoonStyle)}> ...Coming Soon... </div>
}
