import styled from '@emotion/styled';
import { MenuItem, TextField } from '@mui/material';
import { BuilderGoodiePickerProps } from '@wepublish/website/builder';
import { useTranslation } from 'react-i18next';

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

export const ReflektGoodiePicker = ({
  goodies,
  className,
  name,
  value,
  disabled,
  onChange,
}: BuilderGoodiePickerProps) => {
  const { t } = useTranslation();

  return (
    <GoodieSelect
      select
      fullWidth
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
  );
};
