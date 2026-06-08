import { List } from '@mui/material';

import { ExpandCollapseAllButton, useExpandable } from './expandable';
import { PaletteListItem } from './palette-list-item';
import { paletteSchema } from './schema';

type PaletteListProps = {
  name: string;
};

const paletteKeys = Object.keys(paletteSchema.shape);

export const PaletteList = ({ name }: PaletteListProps) => {
  const { isOpen, toggle, allOpen, toggleAll } = useExpandable(paletteKeys);

  return (
    <>
      <ExpandCollapseAllButton
        allOpen={allOpen}
        onToggleAll={toggleAll}
      />

      <List>
        <PaletteListItem
          name={`${name}.primary`}
          keys={['main', 'dark', 'light', 'contrastText']}
          onOpen={() => toggle('primary')}
          isOpen={isOpen('primary')}
        />

        <PaletteListItem
          name={`${name}.secondary`}
          keys={['main', 'dark', 'light', 'contrastText']}
          onOpen={() => toggle('secondary')}
          isOpen={isOpen('secondary')}
        />

        <PaletteListItem
          name={`${name}.accent`}
          keys={['main', 'dark', 'light', 'contrastText']}
          onOpen={() => toggle('accent')}
          isOpen={isOpen('accent')}
        />

        <PaletteListItem
          name={`${name}.background`}
          keys={['default', 'paper']}
          onOpen={() => toggle('background')}
          isOpen={isOpen('background')}
        />

        <PaletteListItem
          name={`${name}.text`}
          keys={['primary']}
          onOpen={() => toggle('text')}
          isOpen={isOpen('text')}
        />

        <PaletteListItem
          name={`${name}.info`}
          keys={['main', 'dark', 'light', 'contrastText']}
          onOpen={() => toggle('info')}
          isOpen={isOpen('info')}
        />

        <PaletteListItem
          name={`${name}.success`}
          keys={['main', 'dark', 'light', 'contrastText']}
          onOpen={() => toggle('success')}
          isOpen={isOpen('success')}
        />

        <PaletteListItem
          name={`${name}.error`}
          keys={['main', 'dark', 'light', 'contrastText']}
          onOpen={() => toggle('error')}
          isOpen={isOpen('error')}
        />

        <PaletteListItem
          name={`${name}.warning`}
          keys={['main', 'dark', 'light', 'contrastText']}
          onOpen={() => toggle('warning')}
          isOpen={isOpen('warning')}
        />

        <PaletteListItem
          name={`${name}.divider`}
          onOpen={() => toggle('divider')}
          isOpen={isOpen('divider')}
        />
      </List>
    </>
  );
};
