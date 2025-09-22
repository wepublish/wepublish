import {BuilderSubscribeBlockProps} from '@wepublish/website/builder'

import {SubscribeContainer} from './subscribe-container'

export type SubscribeBlockProps = BuilderSubscribeBlockProps

export const SubscribeBlock = ({className, memberPlanIds}: SubscribeBlockProps) => {
  return <SubscribeContainer className={className} memberPlanIds={memberPlanIds ?? undefined} />
}
