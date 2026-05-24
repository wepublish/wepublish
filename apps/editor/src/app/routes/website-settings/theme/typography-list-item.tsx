import {
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
} from '@mui/material';
import { memo, useEffect, useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdExpandLess, MdExpandMore } from 'react-icons/md';

import { LengthSlider, UnitConfig } from './length-slider';

const fontSizeCongi: UnitConfig = {
  em: { min: 0.5, max: 6.5, step: 0.05 },
  rem: { min: 0.5, max: 6.5, step: 0.05 },
  px: { min: 8, max: 100, step: 1 },
};

const lineHeightConfig: UnitConfig = {
  em: { min: 1, max: 3, step: 0.1 },
  rem: { min: 1, max: 3, step: 0.1 },
  px: { min: 12, max: 60, step: 1 },
};

const letterSpacingConfig: UnitConfig = {
  em: { min: -0.1, max: 0.2, step: 0.005 },
  rem: { min: -0.1, max: 1.5, step: 0.005 },
  px: { min: -2, max: 5, step: 0.2 },
};

const FONT_WEIGHTS = [
  { value: 100, label: 'Thin' },
  { value: 200, label: 'Extra Light' },
  { value: 300, label: 'Light' },
  { value: 400, label: 'Normal' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'Semi Bold' },
  { value: 700, label: 'Bold' },
  { value: 800, label: 'Extra Bold' },
  { value: 900, label: 'Black' },
];

type TypographyListItemProps = {
  isOpen: boolean;
  name: string;
  onOpen: () => void;
};

export const TypographyListItem = memo<TypographyListItemProps>(
  ({ name, isOpen, onOpen }) => {
    const { t } = useTranslation();
    const { control } = useFormContext();
    const [playAnimation, setPlayAnimation] = useState(true);

    const fontSize = useWatch({
      control,
      name: `${name}.fontSize`,
      disabled: !isOpen,
    });

    const lineHeight = useWatch({
      control,
      name: `${name}.lineHeight`,
      disabled: !isOpen,
    });

    const letterSpacing = useWatch({
      control,
      name: `${name}.letterSpacing`,
      disabled: !isOpen,
    });

    const fontWeight = useWatch({
      control,
      name: `${name}.fontWeight`,
      disabled: !isOpen,
    });

    useEffect(() => {
      const timeout = setTimeout(() => {
        setPlayAnimation(false);
      }, 250);

      return () => {
        clearTimeout(timeout);
      };
    }, [isOpen]);

    const onClick = () => {
      setPlayAnimation(true);
      onOpen();
    };

    const styles = {
      ...(playAnimation ? { transition: 'all ease-in-out 250ms' } : {}),
      ...(isOpen ? { fontSize, lineHeight, letterSpacing, fontWeight } : {}),
    };

    return (
      <>
        <ListItemButton onClick={onClick}>
          <ListItemText
            primary={
              <span css={styles}>{t(`websiteSettings.theme.${name}`)}</span>
            }
          />

          {isOpen ?
            <MdExpandLess />
          : <MdExpandMore />}
        </ListItemButton>

        <Collapse
          timeout="auto"
          in={isOpen}
        >
          <List component="div">
            <ListItem>
              <Controller
                name={`${name}.fontSize`}
                control={control}
                render={({ field }) => (
                  <LengthSlider
                    {...field}
                    defaultUnit="rem"
                    unitConfig={fontSizeCongi}
                  />
                )}
              />
            </ListItem>

            <ListItem>
              <Controller
                name={`${name}.lineHeight`}
                control={control}
                render={({ field }) => (
                  <LengthSlider
                    {...field}
                    defaultUnit="em"
                    unitConfig={lineHeightConfig}
                  />
                )}
              />
            </ListItem>

            <ListItem>
              <Controller
                name={`${name}.letterSpacing`}
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <LengthSlider
                    {...field}
                    error={error}
                    defaultUnit="em"
                    unitConfig={letterSpacingConfig}
                  />
                )}
              />
            </ListItem>

            <ListItem>
              <Controller
                name={`${name}.fontWeight`}
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? ''}
                    size="small"
                    displayEmpty
                    onChange={e => field.onChange(Number(e.target.value))}
                    onBlur={field.onBlur}
                    sx={{ width: '100%' }}
                  >
                    {FONT_WEIGHTS.map(({ value, label }) => (
                      <MenuItem
                        key={value}
                        value={value}
                        sx={{ fontWeight: value }}
                      >
                        {value} — {label}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </ListItem>
          </List>
        </Collapse>
      </>
    );
  }
);
