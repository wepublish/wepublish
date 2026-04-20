import { List, ListSubheader } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { typographySchema } from './schema';
import { TypographyListItem } from './typography-list-item';

type TypographyListProps = {
  name: string;
  defaultValue: z.infer<typeof typographySchema>;
};

export const TypographyList = ({ name, defaultValue }: TypographyListProps) => {
  const { t } = useTranslation();

  const [openTypography, setOpenTypography] =
    useState<keyof z.infer<typeof typographySchema>>();

  const handleOpenTypography = (type: typeof openTypography) => () =>
    setOpenTypography(oldType => (oldType === type ? undefined : type));

  return (
    <List
      aria-labelledby="typography-subheader"
      subheader={
        <ListSubheader
          component="div"
          id="typography-subheader"
        >
          {t('websiteSettings.theme.typography')}
        </ListSubheader>
      }
    >
      <TypographyListItem
        name={`${name}.h1`}
        defaultValue={defaultValue.h1}
        onOpen={handleOpenTypography('h1')}
        isOpen={openTypography === 'h1'}
      />

      <TypographyListItem
        name={`${name}.h2`}
        defaultValue={defaultValue.h2}
        onOpen={handleOpenTypography('h2')}
        isOpen={openTypography === 'h2'}
      />

      <TypographyListItem
        name={`${name}.h3`}
        defaultValue={defaultValue.h3}
        onOpen={handleOpenTypography('h3')}
        isOpen={openTypography === 'h3'}
      />

      <TypographyListItem
        name={`${name}.h4`}
        defaultValue={defaultValue.h4}
        onOpen={handleOpenTypography('h4')}
        isOpen={openTypography === 'h4'}
      />

      <TypographyListItem
        name={`${name}.h5`}
        defaultValue={defaultValue.h5}
        onOpen={handleOpenTypography('h5')}
        isOpen={openTypography === 'h5'}
      />

      <TypographyListItem
        name={`${name}.h6`}
        defaultValue={defaultValue.h6}
        onOpen={handleOpenTypography('h6')}
        isOpen={openTypography === 'h6'}
      />

      <TypographyListItem
        name={`${name}.body1`}
        defaultValue={defaultValue.body1}
        onOpen={handleOpenTypography('body1')}
        isOpen={openTypography === 'body1'}
      />
    </List>
  );
};
