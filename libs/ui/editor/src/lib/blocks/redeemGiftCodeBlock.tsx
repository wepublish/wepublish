import { BlockProps } from '../atoms/blockList';
import { BlockSections } from '../atoms/blockSection';
import { SubscribeBlockFieldsSection } from './subscribeBlock';
import { RedeemGiftCodeBlockValue } from './types';

export const RedeemGiftCodeBlock = ({
  value,
  onChange,
  disabled,
}: BlockProps<RedeemGiftCodeBlockValue>) => (
  <BlockSections>
    <SubscribeBlockFieldsSection
      fields={value.fields}
      disabled={disabled}
      onChange={fields => onChange(current => ({ ...current, fields }))}
    />
  </BlockSections>
);
