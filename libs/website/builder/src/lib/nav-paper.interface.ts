import {FullNavigationFragment} from '@wepublish/website/api'
import {PropsWithChildren} from 'react'

export type BuilderNavPaperProps = PropsWithChildren<{
  loginUrl?: string | null
  profileUrl?: string | null
  subscriptionsUrl?: string | null
  main: FullNavigationFragment | null | undefined
  categories: FullNavigationFragment[][]
  iconItems: FullNavigationFragment | null | undefined
  closeMenu: () => void
}>
