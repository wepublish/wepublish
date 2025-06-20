import {SubscribePage} from '@wepublish/utils/website'
import {sortBy} from 'ramda'
import {ComponentProps} from 'react'

export const HAS_FORM_FIELDS: ComponentProps<typeof SubscribePage>['fields'] = [
  'firstName',
  'address',
  'emailRepeated'
]

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
      fields={HAS_FORM_FIELDS}
    />
  )
}

Mitmachen.getInitialProps = SubscribePage.getInitialProps
