import {SubscribePage} from '@wepublish/utils/website'

export default function Mitmachen() {
  return (
    <SubscribePage
      defaults={{
        memberPlanSlug: 'gruppetto'
      }}
    />
  )
}

Mitmachen.getInitialProps = SubscribePage.getInitialProps
