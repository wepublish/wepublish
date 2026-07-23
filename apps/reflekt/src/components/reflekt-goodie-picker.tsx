import styled from '@emotion/styled';
import { MenuItem, TextField, Typography } from '@mui/material';
import { FullImageGalleryBlockFragment } from '@wepublish/website/api';
import { BuilderGoodiePickerProps } from '@wepublish/website/builder';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

import { ReflektImageSliderSlim } from './reflekt-image-slider';

const GoodieSelect = styled(TextField)`
  .MuiOutlinedInput-root {
    border-radius: 0;
  }

  .MuiOutlinedInput-notchedOutline,
  .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline,
  .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
    border-color: ${({ theme }) => theme.palette.common.black};
  }
`;

const GoodieSliderArea = styled('div')`
  grid-area: goodieSlider;

  ${({ theme }) => theme.breakpoints.down('md')} {
    width: 100vw;
    margin-left: calc(50% - 50vw);
  }
`;

const GoodieSliderTitle = styled(Typography)`
  font-size: 1.5rem;
  margin-bottom: ${({ theme }) => theme.spacing(3)};

  ${({ theme }) => theme.breakpoints.down('md')} {
    padding: 0 32px;
  }
` as typeof Typography;

const GoodieSelectArea = styled('div')`
  grid-area: goodie;
`;

export const ReflektGoodiePicker = forwardRef<
  HTMLInputElement,
  BuilderGoodiePickerProps
>(function ReflektGoodiePicker(
  { goodies, allGoodies, className, name, value, disabled, onChange },
  ref
) {
  const { t } = useTranslation();

  const goodieImages = (allGoodies ?? goodies)
    .filter(goodie => goodie.image)
    .map(goodie => ({
      caption: null,
      image: goodie.image,
    })) as FullImageGalleryBlockFragment['images'];

  const repeatCount =
    goodieImages.length ? Math.ceil(4 / goodieImages.length) : 0;
  const images = Array.from({ length: repeatCount }).flatMap(
    () => goodieImages
  );

  return (
    <>
      {!!images.length && (
        <GoodieSliderArea>
          <GoodieSliderTitle
            variant="h2"
            component="h2"
          >
            Goodies
          </GoodieSliderTitle>

          <ReflektImageSliderSlim images={images} />
        </GoodieSliderArea>
      )}

      <GoodieSelectArea>
        <GoodieSelect
          select
          fullWidth
          inputRef={ref}
          className={className}
          name={name}
          value={value ?? ''}
          disabled={disabled}
          label={
            disabled ? t('subscribe.goodie.none') : t('subscribe.goodie.title')
          }
          onChange={event => onChange(event.target.value || null)}
        >
          <MenuItem value="">{t('subscribe.goodie.none')}</MenuItem>

          {goodies.map(goodie => (
            <MenuItem
              key={goodie.id}
              value={goodie.id}
            >
              {goodie.name}
            </MenuItem>
          ))}
        </GoodieSelect>
      </GoodieSelectArea>
    </>
  );
});
