import {
  BlockContent,
  SubscribeBlock as SubscribeBlockType,
} from '@wepublish/website/api';
import {
  BuilderSubscribeBlockProps,
  BuilderSubscribeProps,
  Subscribe,
} from '@wepublish/website/builder';
import { replace, toLower } from 'ramda';
import { useMemo } from 'react';
import { useSubscribeBlock } from './subscribe-block.context';
import { PaymentForm } from '@wepublish/payment/website';

export const isSubscribeBlock = (
  block: Pick<BlockContent, '__typename'>
): block is SubscribeBlockType => block.__typename === 'SubscribeBlock';

const lowercase = replace(/^./, toLower);

export const SubscribeBlock = ({
  className,
  memberPlans,
  fields,
}: BuilderSubscribeBlockProps) => {
  const {
    register: [register],
    subscribe,
    stripeClientSecret,
    redirectPages,
    ...subscribeProps
  } = useSubscribeBlock();

  const memberPlansObj = useMemo(
    () =>
      ({
        loading: false,
        data: {
          memberPlans: {
            nodes: memberPlans,
            totalCount: memberPlans.length,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
            },
          },
        },
      }) satisfies BuilderSubscribeProps['memberPlans'],
    [memberPlans]
  );

  return (
    <>
      <PaymentForm
        stripeClientSecret={stripeClientSecret}
        redirectPages={redirectPages}
      />

      <Subscribe
        {...subscribeProps}
        className={className}
        memberPlans={memberPlansObj}
        fields={fields.map(lowercase) as BuilderSubscribeProps['fields']}
        onSubscribe={async formData => {
          const selectedMemberplan = memberPlans.find(
            mb => mb.id === formData.memberPlanId
          );

          const result = await subscribe(selectedMemberplan, {
            variables: {
              ...formData,
            },
          });

          if (result.errors) {
            throw result.errors;
          }
        }}
        onSubscribeWithRegister={async formData => {
          const { errors: registerErrors } = await register({
            variables: formData.register,
          });

          if (registerErrors) {
            throw registerErrors;
          }

          const selectedMemberplan = memberPlans.find(
            mb => mb.id === formData.subscribe.memberPlanId
          );

          const result = await subscribe(selectedMemberplan, {
            variables: {
              ...formData.subscribe,
            },
          });

          if (result.errors) {
            throw result.errors;
          }
        }}
      />
    </>
  );
};
