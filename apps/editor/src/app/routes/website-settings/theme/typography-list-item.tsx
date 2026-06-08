import {
  Collapse,
  FormControl,
  FormControlLabel,
  FormLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { memo, useEffect, useMemo, useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdExpandLess, MdExpandMore } from 'react-icons/md';

import { AvailableFontsPicker } from './available-fonts-picker';
import { FontWeightSelect } from './font-weight-select';
import { LengthSlider, UnitConfig } from './length-slider';
import { TextTransformSelect } from './text-transform-select';

export const fontSizeConfig: UnitConfig = {
  em: { min: 0.5, max: 6.5, step: 0.05 },
  rem: { min: 0.5, max: 6.5, step: 0.05 },
  px: { min: 8, max: 100, step: 1 },
};

export const lineHeightConfig: UnitConfig = {
  em: { min: 1, max: 3, step: 0.1 },
  rem: { min: 1, max: 3, step: 0.1 },
  px: { min: 12, max: 60, step: 1 },
};

export const letterSpacingConfig: UnitConfig = {
  em: { min: -0.1, max: 0.2, step: 0.005 },
  rem: { min: -0.1, max: 1.5, step: 0.005 },
  px: { min: -2, max: 5, step: 0.2 },
};

type TypographyListItemProps = {
  isOpen: boolean;
  name: string;
  parentName: string;
  onOpen: () => void;
};

export const TypographyListItem = memo<TypographyListItemProps>(
  ({ name, parentName, isOpen, onOpen }) => {
    const { t } = useTranslation();
    const { control, watch, getValues } = useFormContext();
    const [playAnimation, setPlayAnimation] = useState(true);

    const fontFamily = useWatch({
      control,
      name: `${name}.fontFamily`,
      disabled: !isOpen,
    });

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

    const textTransform = useWatch({
      control,
      name: `${name}.textTransform`,
      disabled: !isOpen,
    });

    const fontStyle = useWatch({
      control,
      name: `${name}.fontStyle`,
      disabled: !isOpen,
    });

    const parentFontFamily = watch(`${parentName}.allVariants.fontFamily`);
    const parentLineHeight = watch(`${parentName}.allVariants.lineHeight`);
    const parentLetterSpacing = watch(
      `${parentName}.allVariants.letterSpacing`
    );

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

    const styles = useMemo(() => {
      return {
        ...(playAnimation ? { transition: 'all ease-in-out 250ms' } : {}),
        ...(isOpen ?
          {
            fontSize,
            lineHeight: lineHeight ?? parentLineHeight,
            letterSpacing: letterSpacing ?? parentLetterSpacing,
            fontWeight,
            fontFamily:
              fontFamily ? fontFamily : (parentFontFamily ?? 'sans-serif'),
            textTransform: textTransform ?? undefined,
            fontStyle: fontStyle ?? undefined,
          }
        : {}),
      };
    }, [
      playAnimation,
      isOpen,
      fontSize,
      lineHeight,
      parentLineHeight,
      letterSpacing,
      parentLetterSpacing,
      fontWeight,
      fontFamily,
      parentFontFamily,
      textTransform,
      fontStyle,
    ]);

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
          mountOnEnter
          unmountOnExit
        >
          <List
            component="div"
            sx={{ maxWidth: 800 }}
          >
            <ListItem>
              <Stack
                direction="row"
                spacing={1}
                sx={{ width: '100%' }}
              >
                <FormControl fullWidth>
                  <FormLabel>
                    {t('websiteSettings.theme.typography.fontFamily')}
                  </FormLabel>

                  <Controller
                    name={`${name}.fontFamily`}
                    control={control}
                    render={({ field }) => <AvailableFontsPicker {...field} />}
                  />
                </FormControl>

                <FormControl fullWidth>
                  <FormLabel>
                    {t('websiteSettings.theme.typography.fontWeight')}
                  </FormLabel>

                  <Controller
                    name={`${name}.fontWeight`}
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <FontWeightSelect
                        {...field}
                        error={error}
                      />
                    )}
                  />
                </FormControl>
              </Stack>
            </ListItem>

            <ListItem>
              <Stack
                direction="row"
                spacing={1}
                sx={{ width: '100%' }}
              >
                <FormControl fullWidth>
                  <FormLabel>
                    {t('websiteSettings.theme.typography.textTransform')}
                  </FormLabel>

                  <Controller
                    name={`${name}.textTransform`}
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <TextTransformSelect
                        {...field}
                        error={error}
                      />
                    )}
                  />
                </FormControl>

                <FormControl fullWidth>
                  <FormLabel>
                    {t('websiteSettings.theme.typography.italic')}
                  </FormLabel>

                  <Controller
                    name={`${name}.fontStyle`}
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value === 'italic'}
                        onChange={e =>
                          field.onChange(e.target.checked ? 'italic' : null)
                        }
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                </FormControl>
              </Stack>
            </ListItem>

            <ListItem>
              <FormControl fullWidth>
                <FormLabel>
                  {t('websiteSettings.theme.typography.fontSize')}
                </FormLabel>

                <Controller
                  name={`${name}.fontSize`}
                  control={control}
                  render={({ field }) => (
                    <LengthSlider
                      {...field}
                      defaultUnit="rem"
                      unitConfig={fontSizeConfig}
                    />
                  )}
                />
              </FormControl>
            </ListItem>

            <ListItem>
              <Controller
                name={`${name}.lineHeight`}
                control={control}
                render={({ field }) => (
                  <Stack
                    direction="column"
                    sx={{ width: '100%' }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value != null}
                          onChange={e => {
                            if (e.target.checked) {
                              field.onChange(
                                getValues(
                                  `${parentName}.allVariants.lineHeight`
                                )
                              );
                            } else {
                              field.onChange(null);
                            }
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2">
                          {t('websiteSettings.theme.typography.lineHeight')}
                        </Typography>
                      }
                    />

                    {field.value && (
                      <LengthSlider
                        {...field}
                        defaultUnit="em"
                        unitConfig={lineHeightConfig}
                        disabled={field.value == null}
                      />
                    )}
                  </Stack>
                )}
              />
            </ListItem>

            <ListItem>
              <Controller
                name={`${name}.letterSpacing`}
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <Stack
                    direction="column"
                    sx={{ width: '100%' }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value != null}
                          onChange={e => {
                            if (e.target.checked) {
                              field.onChange(
                                getValues(
                                  `${parentName}.allVariants.letterSpacing`
                                ) ?? '0em'
                              );
                            } else {
                              field.onChange(null);
                            }
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2">
                          {t('websiteSettings.theme.typography.letterSpacing')}
                        </Typography>
                      }
                    />

                    {field.value && (
                      <LengthSlider
                        {...field}
                        error={error}
                        defaultUnit="em"
                        unitConfig={letterSpacingConfig}
                        disabled={field.value == null}
                      />
                    )}
                  </Stack>
                )}
              />
            </ListItem>
          </List>
        </Collapse>
      </>
    );
  }
);
