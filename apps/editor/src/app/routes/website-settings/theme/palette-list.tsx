import { List } from '@mui/material';
import { useState } from 'react';
import { z } from 'zod';

import { PaletteListItem } from './palette-list-item';
import { paletteSchema } from './schema';

type PaletteListProps = {
  name: string;
};

export const PaletteList = ({ name }: PaletteListProps) => {
  const [openPalette, setOpenPalette] =
    useState<keyof z.infer<typeof paletteSchema>>();

  const handleOpenPalette = (type: typeof openPalette) => () =>
    setOpenPalette(oldType => (oldType === type ? undefined : type));

  return (
    <List>
      <PaletteListItem
        name={`${name}.primary`}
        keys={['main', 'dark', 'light', 'contrastText']}
        onOpen={handleOpenPalette('primary')}
        isOpen={openPalette === 'primary'}
      />

      <PaletteListItem
        name={`${name}.secondary`}
        keys={['main', 'dark', 'light', 'contrastText']}
        onOpen={handleOpenPalette('secondary')}
        isOpen={openPalette === 'secondary'}
      />

      <PaletteListItem
        name={`${name}.accent`}
        keys={['main', 'dark', 'light', 'contrastText']}
        onOpen={handleOpenPalette('accent')}
        isOpen={openPalette === 'accent'}
      />

      <PaletteListItem
        name={`${name}.info`}
        keys={['main', 'dark', 'light', 'contrastText']}
        onOpen={handleOpenPalette('info')}
        isOpen={openPalette === 'info'}
      />

      <PaletteListItem
        name={`${name}.success`}
        keys={['main', 'dark', 'light', 'contrastText']}
        onOpen={handleOpenPalette('success')}
        isOpen={openPalette === 'success'}
      />

      <PaletteListItem
        name={`${name}.error`}
        keys={['main', 'dark', 'light', 'contrastText']}
        onOpen={handleOpenPalette('error')}
        isOpen={openPalette === 'error'}
      />

      <PaletteListItem
        name={`${name}.warning`}
        keys={['main', 'dark', 'light', 'contrastText']}
        onOpen={handleOpenPalette('warning')}
        isOpen={openPalette === 'warning'}
      />

      <PaletteListItem
        name={`${name}.divider`}
        onOpen={handleOpenPalette('divider')}
        isOpen={openPalette === 'divider'}
      />
    </List>
  );
};
