import { List, SimplePaletteColorOptions } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { PaletteListItem } from './palette-list-item';
import { paletteSchema } from './schema';

type PaletteListProps = {
  name: string;
  defaultValue: z.infer<typeof paletteSchema>;
};

export const PaletteList = ({ name, defaultValue }: PaletteListProps) => {
  const { t } = useTranslation();

  const [openPalette, setOpenPalette] =
    useState<keyof z.infer<typeof paletteSchema>>();

  const handleOpenPalette = (type: typeof openPalette) => () =>
    setOpenPalette(oldType => (oldType === type ? undefined : type));

  return (
    <List>
      <PaletteListItem
        name={`${name}.primary`}
        defaultValue={defaultValue.primary as SimplePaletteColorOptions}
        keys={['main', 'dark', 'light', 'contrastText']}
        onOpen={handleOpenPalette('primary')}
        isOpen={openPalette === 'primary'}
      />

      <PaletteListItem
        name={`${name}.secondary`}
        defaultValue={defaultValue.secondary as SimplePaletteColorOptions}
        keys={['main', 'dark', 'light', 'contrastText']}
        onOpen={handleOpenPalette('secondary')}
        isOpen={openPalette === 'secondary'}
      />

      <PaletteListItem
        name={`${name}.accent`}
        defaultValue={defaultValue.accent as SimplePaletteColorOptions}
        keys={['main', 'dark', 'light', 'contrastText']}
        onOpen={handleOpenPalette('accent')}
        isOpen={openPalette === 'accent'}
      />

      <PaletteListItem
        name={`${name}.info`}
        defaultValue={defaultValue.info as SimplePaletteColorOptions}
        keys={['main', 'dark', 'light', 'contrastText']}
        onOpen={handleOpenPalette('info')}
        isOpen={openPalette === 'info'}
      />

      <PaletteListItem
        name={`${name}.success`}
        defaultValue={defaultValue.success as SimplePaletteColorOptions}
        keys={['main', 'dark', 'light', 'contrastText']}
        onOpen={handleOpenPalette('success')}
        isOpen={openPalette === 'success'}
      />

      <PaletteListItem
        name={`${name}.error`}
        defaultValue={defaultValue.error as SimplePaletteColorOptions}
        keys={['main', 'dark', 'light', 'contrastText']}
        onOpen={handleOpenPalette('error')}
        isOpen={openPalette === 'error'}
      />

      <PaletteListItem
        name={`${name}.warning`}
        defaultValue={defaultValue.warning as SimplePaletteColorOptions}
        keys={['main', 'dark', 'light', 'contrastText']}
        onOpen={handleOpenPalette('warning')}
        isOpen={openPalette === 'warning'}
      />

      <PaletteListItem
        name={`${name}.divider`}
        defaultValue={defaultValue.divider}
        onOpen={handleOpenPalette('divider')}
        isOpen={openPalette === 'divider'}
      />
    </List>
  );
};
