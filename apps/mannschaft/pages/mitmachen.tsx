import { useUserCountry } from '@wepublish/utils/website';
import { SubscribePage } from '@wepublish/utils/website/next';
import { Currency } from '@wepublish/website/api';

export default function Mitmachen() {
  const userCountry = useUserCountry() ?? 'CH';

  return (
    <SubscribePage
      filter={memberPlans =>
        memberPlans.filter(memberPlan => {
          if (userCountry === 'CH') {
            return memberPlan.currency === Currency.Chf;
          }

          return memberPlan.currency === Currency.Eur;
        })
      }
      fields={[
        'firstName',
        'address',
        'birthday',
        'password',
        'passwordRepeated',
      ]}
    />
  );
}

Mitmachen.getInitialProps = SubscribePage.getInitialProps;
