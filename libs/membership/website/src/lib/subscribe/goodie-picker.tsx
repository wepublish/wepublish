import styled from '@emotion/styled';
import { FormControlLabel, Radio, RadioGroup } from '@mui/material';
import {
  BuilderGoodiePickerProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

export const GoodieOptions = styled(RadioGroup)`
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

export const GoodieOptionImage = styled('div')`
  width: ${({ theme }) => theme.spacing(8)};

  img {
    width: 100%;
    height: auto;
    border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  }
`;

export const GoodieOptionName = styled('strong')`
  display: block;
`;

export const GoodiePicker = forwardRef<
  HTMLDivElement,
  BuilderGoodiePickerProps
>(function GoodiePicker(
  { goodies, className, name, value, disabled, onChange },
  ref
) {
  const {
    elements: { Image },
    richtext: { RenderRichtext },
  } = useWebsiteBuilder();
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
        label={t('subscribe.goodie.none')}
      />

      {goodies.map(goodie => (
        <GoodieOption
          key={goodie.id}
          value={goodie.id}
          control={<Radio />}
          disabled={disabled}
          label={
            <GoodieOptionContent>
              {goodie.image && (
                <GoodieOptionImage>
                  <Image image={goodie.image} />
                </GoodieOptionImage>
              )}

              <div>
                <GoodieOptionName>{goodie.name}</GoodieOptionName>

                {goodie.description && (
                  <RenderRichtext document={goodie.description} />
                )}
              </div>
            </GoodieOptionContent>
          }
        />
      ))}
    </GoodieOptions>
  );
});
