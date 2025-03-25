import {FullImageFragment, FullNavigationFragment} from '@wepublish/website/api'
import {PropsWithChildren, ReactNode} from 'react'
import {ButtonProps, UseToggle} from '@wepublish/ui'

export type BuilderNavAppBarProps = PropsWithChildren<{
  loginBtn?: ButtonProps | null
  profileBtn?: ButtonProps | null
  subscribeBtn?: ButtonProps | null
  logo?: FullImageFragment | null
  headerItems: FullNavigationFragment | null | undefined
  menuToggle: UseToggle
  actions?: ReactNode
}>
