import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen, within } from '@testing-library/react';
import {
  EditorBlockType,
  TeaserSlotType,
  TeaserType,
} from '@wepublish/editor/api';

import { TeaserSlot, TeaserSlotsBlock } from './teaserSlotsBlock';
import { TeaserSlotsBlockValue } from './types';

const theme = createTheme({ cssVariables: true });

vi.mock('@apollo/client/react', () => ({
  useQuery: () => ({ data: undefined, loading: false, refetch: vi.fn() }),
  useLazyQuery: () => [vi.fn(), { data: undefined, loading: false }],
}));

const renderBlock = () =>
  render(
    <ThemeProvider theme={theme}>
      <TeaserSlotsBlock
        type={EditorBlockType.TeaserSlots}
        value={
          {
            title: '',
            autofillConfig: { enabled: false },
            slots: [{ type: 'Manual', teaser: null }],
            autofillTeasers: [],
          } as unknown as TeaserSlotsBlockValue
        }
        onChange={vi.fn()}
      />
    </ThemeProvider>
  );

describe('TeaserSlotsBlock', () => {
  it('toggles automatic loading with a checkbox', () => {
    renderBlock();

    expect(screen.queryByRole('switch')).toBeNull();
    expect(
      screen.getByRole('checkbox', {
        name: /blocks.teaserSlots.autoLoadingToggle/,
      })
    ).not.toBeChecked();
  });

  it('offers adding a slot as a text button', () => {
    renderBlock();

    expect(
      screen.getByRole('button', { name: 'blocks.teaserSlots.addSlot' })
    ).toHaveClass('MuiButton-text');
  });

  it('draws each slot with a single border', () => {
    const { container } = renderBlock();

    expect(container.querySelector('.MuiPaper-outlined')).toBeNull();
  });
});

const renderSlot = (teaser: unknown, autofillEnabled = false) =>
  render(
    <ThemeProvider theme={theme}>
      <TeaserSlot
        teaser={teaser as never}
        numColumns={3}
        showGrabCursor
        onEdit={vi.fn()}
        onChoose={vi.fn()}
        onDelete={vi.fn()}
        onRemove={vi.fn()}
        onSlotTypeChange={vi.fn()}
        slotType={TeaserSlotType.Manual}
        autofillEnabled={autofillEnabled}
      />
    </ThemeProvider>
  );

const actionNames = () =>
  within(screen.getByRole('toolbar'))
    .getAllByRole('button')
    .map(button => button.getAttribute('aria-label'));

describe('TeaserSlot', () => {
  it('offers the same teaser actions as the other teaser tiles', () => {
    renderSlot({ type: TeaserType.Custom, title: 'Hello', image: null });

    expect(actionNames()).toEqual([
      'blocks.flexTeaser.chooseTeaser',
      'blocks.flexTeaser.editTeaser',
      'blocks.flexTeaser.deleteTeaser',
    ]);
  });

  it('offers deleting an empty slot in the same place', () => {
    renderSlot(null);

    expect(actionNames()).toEqual(['blocks.teaserSlots.deleteSlot']);
  });

  it('toggles a manual slot from the same toolbar', () => {
    renderSlot(null, true);

    expect(
      within(screen.getByRole('toolbar')).getByRole('button', {
        name: 'blocks.teaserSlots.manualSlot',
      })
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('uses the same small buttons as the other teaser tiles', () => {
    renderSlot({ type: TeaserType.Custom, title: 'Hello', image: null }, true);

    within(screen.getByRole('toolbar'))
      .getAllByRole('button')
      .forEach(button => expect(button).toHaveClass('MuiIconButton-sizeSmall'));
  });
});
