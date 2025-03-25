import {FullNavigationFragment} from '@wepublish/website/api'
import {PropsWithChildren} from 'react'
import {ButtonProps} from '@wepublish/ui'

export type BuilderNavPaperProps = PropsWithChildren<{
  loginBtn?: ButtonProps | null
  profileBtn?: ButtonProps | null
  subscribeBtn?: ButtonProps | null
  main: FullNavigationFragment | null | undefined
  categories: FullNavigationFragment[][]
  iconItems: FullNavigationFragment | null | undefined
  closeMenu: () => void
}>
