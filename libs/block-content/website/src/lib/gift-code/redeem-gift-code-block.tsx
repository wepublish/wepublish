import { GiftCodeRedeemContainer } from '@wepublish/membership/website';
import {
  FullBlockFragment,
  FullRedeemGiftCodeBlockFragment,
} from '@wepublish/website/api';
import {
  BuilderGiftCodeRedeemProps,
  BuilderRedeemGiftCodeBlockProps,
} from '@wepublish/website/builder';
import { replace, toLower } from 'ramda';

export const isRedeemGiftCodeBlock = (
  block: Partial<Pick<FullBlockFragment, '__typename'>>
): block is FullRedeemGiftCodeBlockFragment =>
  block.__typename === 'RedeemGiftCodeBlock';

const lowercase = replace(/^./, toLower);

export const RedeemGiftCodeBlock = ({
  className,
  fields,
}: BuilderRedeemGiftCodeBlockProps) => (
  <GiftCodeRedeemContainer
    className={className}
    fields={fields.map(lowercase) as BuilderGiftCodeRedeemProps['fields']}
  />
);
