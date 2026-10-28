import {
  Box,
  FormControl,
  FormLabel,
  List,
  Stack,
  Typography,
} from '@mui/material';
import { InfoTooltip } from '@wepublish/ui/editor';
import { memo, RefObject, useId } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { AvailableFontsPicker } from './available-fonts-picker';
import { FontWeightSelect } from './font-weight-select';
import { LengthSlider } from './length-slider';
import { typographyGroups, TypographyVariant } from './typography-groups';
import {
  letterSpacingConfig,
  lineHeightConfig,
  TypographyListItem,
} from './typography-list-item';

export type TypographyHeaderRefs = RefObject<
  Partial<Record<TypographyVariant, HTMLElement | null>>
>;

type TypographyListProps = {
  name: string;
  headerIdPrefix: string;
  headerRefs?: TypographyHeaderRefs;
  openTypography?: TypographyVariant;
  compact?: boolean;
  onToggleTypography: (variant: TypographyVariant) => void;
  onOpened?: (variant: TypographyVariant) => void;
  onClosed?: (variant: TypographyVariant) => void;
};

export const TypographyList = memo(
  ({
    name,
    headerIdPrefix,
    headerRefs,
    openTypography,
    compact,
    onToggleTypography,
    onOpened,
    onClosed,
  }: TypographyListProps) => {
    const { t } = useTranslation();
    const { control } = useFormContext();
    const idPrefix = useId();
    const fontFamilyLabelId = `${idPrefix}-font-family`;
    const fontWeightLabelId = `${idPrefix}-font-weight`;
    const lineHeightLabel = t('websiteSettings.theme.typography.lineHeight');
    const letterSpacingLabel = t(
      'websiteSettings.theme.typography.letterSpacing'
    );

    return (
      <Stack sx={{ gap: 4 }}>
        <Stack
          sx={{
            gap: 2,
            borderRadius: 0.75,
            border: 1,
            borderColor: 'divider',
            p: 2,
          }}
        >
          <Stack sx={{ gap: 0.5 }}>
            <Typography
              component="h2"
              variant="subtitle1"
              sx={{ fontWeight: 600 }}
            >
              {t('websiteSettings.theme.typography.base')}
            </Typography>

            <Typography
              variant="body2"
              sx={{ color: 'text.secondary' }}
            >
              {t('websiteSettings.theme.typography.baseInfo')}
            </Typography>
          </Stack>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
          >
            <Controller
              name={`${name}.allVariants.fontFamily`}
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <FormLabel>
                    <span id={fontFamilyLabelId}>
                      {t('websiteSettings.theme.typography.fontFamily')}
                    </span>{' '}
                    <InfoTooltip
                      text={t(
                        'websiteSettings.theme.typography.baseFontFamilyInfo'
                      )}
                    />
                  </FormLabel>

                  <AvailableFontsPicker
                    {...field}
                    labelId={fontFamilyLabelId}
                  />
                </FormControl>
              )}
            />

            <Controller
              name={`${name}.allVariants.fontWeight`}
              control={control}
              render={({ field, fieldState: { error } }) => (
                <FormControl fullWidth>
                  <FormLabel id={fontWeightLabelId}>
                    {t('websiteSettings.theme.typography.fontWeight')}
                  </FormLabel>

                  <FontWeightSelect
                    {...field}
                    error={error}
                    labelId={fontWeightLabelId}
                  />
                </FormControl>
              )}
            />
          </Stack>

          <Stack
            direction="column"
            spacing={2}
          >
            <Controller
              name={`${name}.allVariants.lineHeight`}
              control={control}
              render={({ field, fieldState: { error } }) => (
                <FormControl fullWidth>
                  <FormLabel>
                    {lineHeightLabel}{' '}
                    <InfoTooltip
                      text={t(
                        'websiteSettings.theme.typography.lineHeightInfo'
                      )}
                    />
                  </FormLabel>

                  <LengthSlider
                    {...field}
                    error={error}
                    defaultUnit="em"
                    unitConfig={lineHeightConfig}
                    label={lineHeightLabel}
                    unitLabel={t('websiteSettings.theme.typography.unitOf', {
                      label: lineHeightLabel,
                    })}
                  />
                </FormControl>
              )}
            />

            <Controller
              name={`${name}.allVariants.letterSpacing`}
              control={control}
              render={({ field, fieldState: { error } }) => (
                <FormControl fullWidth>
                  <FormLabel>
                    {letterSpacingLabel}{' '}
                    <InfoTooltip
                      text={t(
                        'websiteSettings.theme.typography.letterSpacingInfo'
                      )}
                    />
                  </FormLabel>

                  <LengthSlider
                    {...field}
                    error={error}
                    defaultUnit="em"
                    unitConfig={letterSpacingConfig}
                    label={letterSpacingLabel}
                    unitLabel={t('websiteSettings.theme.typography.unitOf', {
                      label: letterSpacingLabel,
                    })}
                  />
                </FormControl>
              )}
            />
          </Stack>
        </Stack>

        {typographyGroups.map(group => {
          const headingId = `${idPrefix}-${group.key}`;

          return (
            <Box
              key={group.key}
              component="section"
            >
              <Typography
                id={headingId}
                component="h2"
                variant="subtitle1"
                sx={{ fontWeight: 600, px: 2, mb: 0.5 }}
              >
                {t(`websiteSettings.theme.typography.groups.${group.key}`)}
              </Typography>

              <List
                aria-labelledby={headingId}
                disablePadding
              >
                {group.variants.map(variant => (
                  <TypographyListItem
                    key={variant}
                    headerId={`${headerIdPrefix}-${variant}-header`}
                    headerRef={header => {
                      if (headerRefs) {
                        headerRefs.current[variant] = header;
                      }
                    }}
                    parentName={name}
                    name={`${name}.${variant}`}
                    compact={compact}
                    onOpen={() => onToggleTypography(variant)}
                    onOpened={() => onOpened?.(variant)}
                    onClosed={() => onClosed?.(variant)}
                    isOpen={openTypography === variant}
                  />
                ))}
              </List>
            </Box>
          );
        })}
      </Stack>
    );
  }
);
