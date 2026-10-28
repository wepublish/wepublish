import {
  Box,
  ButtonBase,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { memo, useId, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import {
  resolvedStyles,
  screenSizes,
  screenSizeWidth,
} from './typography-breakpoints';
import { typographyGroups, TypographyVariant } from './typography-groups';
import { SelectedScreenSize } from './typography-screen-sizes';

type TypeScalePreviewProps = {
  name: string;
  selected?: TypographyVariant;
  onSelect: (variant: TypographyVariant) => void;
};

export const TypeScalePreview = memo<TypeScalePreviewProps>(
  ({ name, selected, onSelect }) => {
    const { t } = useTranslation();
    const { control } = useFormContext();
    const idPrefix = useId();
    const headingId = `${idPrefix}-heading`;
    const captionId = `${idPrefix}-caption`;
    const [screenSize, setScreenSize] = useState<SelectedScreenSize>('xs');

    const typography = useWatch({ control, name });
    const allVariants = typography?.allVariants;

    return (
      <Box
        component="aside"
        aria-labelledby={headingId}
      >
        <Stack sx={{ gap: 2 }}>
          <Typography
            id={headingId}
            component="h2"
            variant="subtitle1"
            sx={{ fontWeight: 600 }}
          >
            {t('websiteSettings.theme.typography.preview')}
          </Typography>

          <Stack sx={{ gap: 0.5 }}>
            <ToggleButtonGroup
              exclusive
              size="small"
              fullWidth
              value={screenSize}
              onChange={(_event, value: SelectedScreenSize | null) => {
                if (value) {
                  setScreenSize(value);
                }
              }}
              aria-label={t(
                'websiteSettings.theme.typography.previewScreenSize'
              )}
              aria-describedby={captionId}
              sx={{ '& .MuiToggleButton-root': { textTransform: 'none' } }}
            >
              <ToggleButton value="xs">
                {t('websiteSettings.theme.typography.baseline')}
              </ToggleButton>

              {screenSizes.map(size => (
                <ToggleButton
                  key={size}
                  value={size}
                >
                  {size}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <Typography
              id={captionId}
              variant="caption"
              sx={{ color: 'text.secondary' }}
            >
              {screenSize === 'xs' ?
                t('websiteSettings.theme.typography.belowWidth', {
                  width: screenSizeWidth(screenSizes[0]),
                })
              : t('websiteSettings.theme.typography.fromWidth', {
                  width: screenSizeWidth(screenSize),
                })
              }
            </Typography>
          </Stack>

          {typographyGroups.map(group => {
            const groupHeadingId = `${idPrefix}-${group.key}`;

            return (
              <Box
                key={group.key}
                component="section"
                aria-labelledby={groupHeadingId}
              >
                <Typography
                  id={groupHeadingId}
                  component="h3"
                  variant="overline"
                  sx={{ color: 'text.secondary', display: 'block', px: 1 }}
                >
                  {t(`websiteSettings.theme.typography.groups.${group.key}`)}
                </Typography>

                <Box
                  component="ul"
                  sx={{ listStyle: 'none', m: 0, p: 0 }}
                >
                  {group.variants.map(variant => (
                    <li key={variant}>
                      <ButtonBase
                        onClick={() => onSelect(variant)}
                        aria-current={selected === variant ? 'true' : undefined}
                        style={resolvedStyles(
                          typography?.[variant],
                          allVariants,
                          screenSize,
                          variant
                        )}
                        sx={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'start',
                          color: 'text.primary',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          px: 1,
                          py: 0.5,
                          borderRadius: 0.75,
                          '&:hover': { bgcolor: 'action.hover' },
                          '&[aria-current="true"]': {
                            bgcolor: 'action.selected',
                          },
                          '&.Mui-focusVisible': {
                            outline: 2,
                            outlineColor: 'primary.main',
                            outlineOffset: 2,
                          },
                        }}
                      >
                        {t(`websiteSettings.theme.typography.${variant}`)}
                      </ButtonBase>
                    </li>
                  ))}
                </Box>
              </Box>
            );
          })}
        </Stack>
      </Box>
    );
  }
);
