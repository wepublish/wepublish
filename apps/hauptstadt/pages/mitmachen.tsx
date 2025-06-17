import {SubscribePage} from '@wepublish/utils/website'
import {sortBy} from 'ramda'
import {ComponentProps} from 'react'

export default function Mitmachen(props: ComponentProps<typeof SubscribePage>) {
  return (
    <SubscribePage
      {...props}
      sort={sortBy(memberPlan => {
        const tag = memberPlan.tags
          ?.find(tag => tag.startsWith('sort-order:'))
          ?.replace('sort-order:', '')

        return tag ? +tag : 0
      })}
    />
  )
}

Mitmachen.getInitialProps = SubscribePage.getInitialProps
