import { FormControl, FormLabel, List, Stack } from '@mui/material';
import { memo, useCallback, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { AvailableFontsPicker } from './available-fonts-picker';
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

export const TypographyList = memo(({ name }: TypographyListProps) => {
  const { t } = useTranslation();
  const { control } = useFormContext();
  const [openTypography, setOpenTypography] =
    useState<keyof z.infer<typeof typographySchema>>();

  const handleOpenTypography = useCallback(
    (type: typeof openTypography) => () =>
      setOpenTypography(oldType => (oldType === type ? undefined : type)),
    []
  );

  return (
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

      <TypographyListItem
        parentName={name}
        name={`${name}.h1`}
        onOpen={handleOpenTypography('h1')}
        isOpen={openTypography === 'h1'}
      />

      <TypographyListItem
        parentName={name}
        name={`${name}.h2`}
        onOpen={handleOpenTypography('h2')}
        isOpen={openTypography === 'h2'}
      />

      <TypographyListItem
        parentName={name}
        name={`${name}.h3`}
        onOpen={handleOpenTypography('h3')}
        isOpen={openTypography === 'h3'}
      />

      <TypographyListItem
        parentName={name}
        name={`${name}.h4`}
        onOpen={handleOpenTypography('h4')}
        isOpen={openTypography === 'h4'}
      />

      <TypographyListItem
        parentName={name}
        name={`${name}.h5`}
        onOpen={handleOpenTypography('h5')}
        isOpen={openTypography === 'h5'}
      />

      <TypographyListItem
        parentName={name}
        name={`${name}.h6`}
        onOpen={handleOpenTypography('h6')}
        isOpen={openTypography === 'h6'}
      />

      <TypographyListItem
        parentName={name}
        name={`${name}.body1`}
        onOpen={handleOpenTypography('body1')}
        isOpen={openTypography === 'body1'}
      />

      <TypographyListItem
        parentName={name}
        name={`${name}.body2`}
        onOpen={handleOpenTypography('body2')}
        isOpen={openTypography === 'body2'}
      />

      <TypographyListItem
        parentName={name}
        name={`${name}.caption`}
        onOpen={handleOpenTypography('caption')}
        isOpen={openTypography === 'caption'}
      />

      <TypographyListItem
        parentName={name}
        name={`${name}.subtitle1`}
        onOpen={handleOpenTypography('subtitle1')}
        isOpen={openTypography === 'subtitle1'}
      />

      <TypographyListItem
        parentName={name}
        name={`${name}.subtitle2`}
        onOpen={handleOpenTypography('subtitle2')}
        isOpen={openTypography === 'subtitle2'}
      />

      <TypographyListItem
        parentName={name}
        name={`${name}.teaserPretitle`}
        onOpen={handleOpenTypography('teaserPretitle')}
        isOpen={openTypography === 'teaserPretitle'}
      />

      <TypographyListItem
        parentName={name}
        name={`${name}.teaserTitle`}
        onOpen={handleOpenTypography('teaserTitle')}
        isOpen={openTypography === 'teaserTitle'}
      />

      <TypographyListItem
        parentName={name}
        name={`${name}.teaserLead`}
        onOpen={handleOpenTypography('teaserLead')}
        isOpen={openTypography === 'teaserLead'}
      />

      <TypographyListItem
        parentName={name}
        name={`${name}.teaserMeta`}
        onOpen={handleOpenTypography('teaserMeta')}
        isOpen={openTypography === 'teaserMeta'}
      />

      <TypographyListItem
        parentName={name}
        name={`${name}.articleAuthors`}
        onOpen={handleOpenTypography('articleAuthors')}
        isOpen={openTypography === 'articleAuthors'}
      />

      <TypographyListItem
        parentName={name}
        name={`${name}.peerInformation`}
        onOpen={handleOpenTypography('peerInformation')}
        isOpen={openTypography === 'peerInformation'}
      />

      <TypographyListItem
        parentName={name}
        name={`${name}.bannerTitle`}
        onOpen={handleOpenTypography('bannerTitle')}
        isOpen={openTypography === 'bannerTitle'}
      />

      <TypographyListItem
        parentName={name}
        name={`${name}.bannerText`}
        onOpen={handleOpenTypography('bannerText')}
        isOpen={openTypography === 'bannerText'}
      />

      <TypographyListItem
        parentName={name}
        name={`${name}.bannerCta`}
        onOpen={handleOpenTypography('bannerCta')}
        isOpen={openTypography === 'bannerCta'}
      />

      <TypographyListItem
        parentName={name}
        name={`${name}.blockBreakTitle`}
        onOpen={handleOpenTypography('blockBreakTitle')}
        isOpen={openTypography === 'blockBreakTitle'}
      />

      <TypographyListItem
        parentName={name}
        name={`${name}.blockBreakBody`}
        onOpen={handleOpenTypography('blockBreakBody')}
        isOpen={openTypography === 'blockBreakBody'}
      />

      <TypographyListItem
        parentName={name}
        name={`${name}.blockTitlePreTitle`}
        onOpen={handleOpenTypography('blockTitlePreTitle')}
        isOpen={openTypography === 'blockTitlePreTitle'}
      />

      <TypographyListItem
        parentName={name}
        name={`${name}.blockQuote`}
        onOpen={handleOpenTypography('blockQuote')}
        isOpen={openTypography === 'blockQuote'}
      />
    </List>
  );
});
