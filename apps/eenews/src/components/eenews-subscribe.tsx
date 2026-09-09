import { Subscribe } from '@wepublish/membership/website';
import { PaymentPeriodicity } from '@wepublish/website/api';
import { BuilderSubscribeProps } from '@wepublish/website/builder';

export const EeNewsSubscribe = (props: BuilderSubscribeProps) => (
  <Subscribe
    {...props}
    supportPeriodicity={PaymentPeriodicity.Yearly}
  />
);
