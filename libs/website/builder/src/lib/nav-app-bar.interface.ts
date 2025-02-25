import {FullImageFragment, FullNavigationFragment} from '@wepublish/website/api'
import {PropsWithChildren, ReactNode} from 'react'
import {UseToggle} from '@wepublish/ui'

export type BuilderNavAppBarProps = PropsWithChildren<{
  loginUrl?: string
  profileUrl?: string
  subscriptionsUrl?: string
  logo?: FullImageFragment | null
  headerItems: FullNavigationFragment | null | undefined
  menuToggle: UseToggle
  actions?: ReactNode
}>
