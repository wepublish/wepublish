import styled from '@emotion/styled';
import { GoodieOptionImage, GoodiePicker } from '@wepublish/membership/website';
import { BuilderGoodiePickerProps } from '@wepublish/website/builder';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const GoodieIncluded = styled('div')`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: ${({ theme }) => theme.spacing(2)};
  align-items: center;
  font-weight: ${({ theme }) => theme.typography.fontWeightMedium};
`;

/**
 * A single available goodie is part of the offer, so it is chosen for the
 * reader and only announced. Several goodies fall back to the regular picker.
 */
export const ZwoelfGoodiePicker = (props: BuilderGoodiePickerProps) => {
  const { goodies, value, onChange, className } = props;
  const { t } = useTranslation();
  const onlyGoodie = goodies.length === 1 ? goodies[0] : undefined;

  useEffect(() => {
    if (onlyGoodie && onlyGoodie.stock !== 0 && value !== onlyGoodie.id) {
      onChange(onlyGoodie.id);
    }
  }, [onlyGoodie, value, onChange]);

  if (!goodies.length) {
    return null;
  }

  if (!onlyGoodie) {
    return <GoodiePicker {...props} />;
  }

  return (
    <GoodieIncluded className={className}>
      {onlyGoodie.image && <GoodieOptionImage image={onlyGoodie.image} />}

      <span>
        {t('zwoelf.subscribe.goodie.included', { goodie: onlyGoodie.name })}
      </span>
    </GoodieIncluded>
  );
};
