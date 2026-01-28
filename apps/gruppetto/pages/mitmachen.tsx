import { SubscribePage } from '@wepublish/utils/website';
import { useRouter } from 'next/router';

export default function Mitmachen() {
  const {
    query: { tag },
  } = useRouter();

  return (
    <SubscribePage
      defaults={{
        memberPlanSlug: 'gruppetto',
      }}
      filter={memberPlans =>
        memberPlans.filter(mb => {
          if (!tag) {
            return !mb.tags?.length;
          }

          return mb.tags?.includes(tag as string);
        })
      }
    />
  );
}

Mitmachen.getInitialProps = SubscribePage.getInitialProps;
