'use client'

import {ComponentProps} from 'react'
import {cn} from '../../utils/cn'

import {Toolbar} from './toolbar'

export function FixedToolbar(props: ComponentProps<typeof Toolbar>) {
  return (
    <Toolbar
      {...props}
      className={cn(
        'sticky top-0 left-0 z-50 scrollbar-hide w-full justify-between overflow-x-auto rounded-t-lg border-b border-b-border bg-background/95 p-1 backdrop-blur-sm supports-backdrop-blur:bg-background/60',
        props.className
      )}
    />
  )
}
