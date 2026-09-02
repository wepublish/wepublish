import { FormControl, FormLabel, List, Stack } from '@mui/material';
import { memo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { AvailableFontsPicker } from './available-fonts-picker';
import { ExpandCollapseAllButton, useExpandable } from './expandable';
import { FontWeightSelect } from './font-weight-select';
import { LengthSlider } from './length-slider';
import { typographySchema } from './schema';
import {
  letterSpacingConfig,
  lineHeightConfig,
  TypographyListItem,
} from './typography-list-item';

type TypographyListProps = {
  name: string;
};

const typographyKeys = Object.keys(typographySchema.shape).filter(
  key => key !== 'allVariants'
);

export const TypographyList = memo(({ name }: TypographyListProps) => {
  const { t } = useTranslation();
  const { control } = useFormContext();
  const { isOpen, toggle, allOpen, toggleAll } = useExpandable(typographyKeys);

  return (
    <>
      <ExpandCollapseAllButton
        allOpen={allOpen}
        onToggleAll={toggleAll}
      />

      <List>
        <Stack
          gap={5}
          sx={{
            borderRadius: '6px',
            bgcolor: '#00000008',
            p: 3,
            mb: 2,
          }}
        >
          <Stack
            direction="row"
            spacing={1}
          >
            <Controller
              name={`${name}.allVariants.fontFamily`}
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <FormLabel>
                    {t('websiteSettings.theme.typography.fontFamily')}
                  </FormLabel>

                  <AvailableFontsPicker {...field} />
                </FormControl>
              )}
            />

            <Controller
              name={`${name}.allVariants.fontWeight`}
              control={control}
              render={({ field, fieldState: { error } }) => (
                <FormControl fullWidth>
                  <FormLabel>
                    {t('websiteSettings.theme.typography.fontWeight')}
                  </FormLabel>

                  <FontWeightSelect
                    {...field}
                    error={error}
                  />
                </FormControl>
              )}
            />
          </Stack>

          <Stack
            direction="column"
            spacing={3}
          >
            <Controller
              name={`${name}.allVariants.lineHeight`}
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <FormLabel>
                    {t('websiteSettings.theme.typography.lineHeight')}
                  </FormLabel>

                  <LengthSlider
                    {...field}
                    defaultUnit="em"
                    unitConfig={lineHeightConfig}
                  />
                </FormControl>
              )}
            />

            <Controller
              name={`${name}.allVariants.letterSpacing`}
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <FormLabel>
                    {t('websiteSettings.theme.typography.letterSpacing')}
                  </FormLabel>

                  <LengthSlider
                    {...field}
                    defaultUnit="em"
                    unitConfig={letterSpacingConfig}
                  />
                </FormControl>
              )}
            />
          </Stack>
        </Stack>

        {typographyKeys.map(key => (
          <TypographyListItem
            key={key}
            parentName={name}
            name={`${name}.${key}`}
            onOpen={() => toggle(key)}
            isOpen={isOpen(key)}
          />
        ))}
      </List>
    </>
  );
});
