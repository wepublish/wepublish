import { SubscribePage } from '@wepublish/utils/website';
import { useRouter } from 'next/router';
import { ComponentProps } from 'react';

type MitmachenProps = ComponentProps<typeof SubscribePage>;

export default function Mitmachen(props: MitmachenProps) {
  const {
    query: { tag },
  } = useRouter();

  return (
    <SubscribePage
      {...props}
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
