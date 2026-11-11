import { DndContext } from '@dnd-kit/core';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { TeaserType } from '@wepublish/editor/api';

import { TeaserCard, TeaserCardProps } from './TeaserCard';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const renderCard = (props: Partial<TeaserCardProps> = {}) => {
  const onClick = vi.fn();

  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <DndContext>
        <TeaserCard
          dragId="slot-1"
          teaser={
            {
              type: TeaserType.Custom,
              title: 'Hello',
              image: null,
            } as TeaserCardProps['teaser']
          }
          slotType="real"
          groupIndex={0}
          nestDepth={0}
          isSelected={false}
          isDuplicate={false}
          selectionActive={false}
          previewState="none"
          onClick={onClick}
          {...props}
        />
      </DndContext>
    </ThemeProvider>
  );

  return onClick;
};

describe('TeaserCard', () => {
  it.each(['Enter', ' '])('selects a teaser with the %j key', key => {
    const onClick = renderCard();
    const card = screen.getByRole('button', { name: /Hello/ });

    fireEvent.keyDown(card, { key });

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('can reach an empty slot with the keyboard while a teaser is selected', () => {
    const onClick = renderCard({
      teaser: null,
      slotType: 'empty',
      selectionActive: true,
    });
    const slot = screen.getByRole('button', {
      name: /teaserOverview.emptySlot/,
    });

    expect(slot.tabIndex).toBe(0);

    fireEvent.keyDown(slot, { key: 'Enter' });

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
