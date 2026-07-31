import styled from '@emotion/styled';
import { FormControlLabel, Radio, RadioGroup } from '@mui/material';
import {
  BuilderGoodiePickerProps,
  Image,
  RenderRichtext,
} from '@wepublish/website/builder';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

export const GoodieOptions = styled(RadioGroup)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing(1)};
`;

export const GoodieOption = styled(FormControlLabel)`
  margin: 0;
  align-items: center;
  padding: ${({ theme }) => theme.spacing(1.5)};
  border: 1px solid ${({ theme }) => theme.palette.divider};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
`;

export const GoodieOptionContent = styled('div')`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: ${({ theme }) => theme.spacing(2)};
  align-items: center;
`;

export const GoodieOptionImage = styled(Image)`
  width: ${({ theme }) => theme.spacing(8)};
  height: auto;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
`;

export const GoodieOptionName = styled('div')`
  font-weight: 600;
`;

export const GoodiePicker = forwardRef<
  HTMLDivElement,
  BuilderGoodiePickerProps
>(function GoodiePicker(
  { goodies, className, name, value, disabled, onChange },
  ref
) {
  const { t } = useTranslation();

  return (
    <GoodieOptions
      ref={ref}
      className={className}
      name={name}
      value={value ?? ''}
      onChange={event => onChange(event.target.value || null)}
    >
      <GoodieOption
        value=""
        control={<Radio />}
        disabled={disabled}
        label={
          <GoodieOptionName>{t('subscribe.goodie.none')}</GoodieOptionName>
        }
      />

      {goodies.map(goodie => (
        <GoodieOption
          key={goodie.id}
          value={goodie.id}
          control={<Radio />}
          disabled={goodie.stock === 0}
          label={
            <GoodieOptionContent>
              {goodie.image && <GoodieOptionImage image={goodie.image} />}

              <div>
                <GoodieOptionName>{goodie.name}</GoodieOptionName>
                <RenderRichtext document={goodie.description} />
              </div>
            </GoodieOptionContent>
          }
        />
      ))}
    </GoodieOptions>
  );
});
