import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { EditorBlockType } from '@wepublish/editor/api';

import { EventBlock } from './eventBlock';
import { EventBlockValue } from './types';

const theme = createTheme({ cssVariables: true });

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) =>
      options?.count != null ? `${key} ${options.count}` : key,
  }),
}));

const event = (id: string, name: string) => ({
  id,
  name,
  startsAt: '2026-11-01T18:00:00.000Z',
  endsAt: null,
  image: null,
});

const renderBlock = (events: unknown[]) =>
  render(
    <ThemeProvider theme={theme}>
      <EventBlock
        type={EditorBlockType.Event}
        value={{ filter: {}, events } as unknown as EventBlockValue}
        onChange={vi.fn()}
      />
    </ThemeProvider>
  );

describe('EventBlock', () => {
  it('spells out how to choose events when empty', () => {
    renderBlock([]);

    expect(screen.getByText('blocks.event.chooseEvents')).toBeVisible();
  });

  it('lists the chosen events below a summary and edit button', () => {
    renderBlock([event('1', 'Book launch'), event('2', 'Town hall')]);

    expect(screen.getByText('blocks.event.events 2')).toBeInTheDocument();
    expect(
      screen.getAllByRole('listitem').map(item => item.textContent)
    ).toEqual([
      expect.stringContaining('Book launch'),
      expect.stringContaining('Town hall'),
    ]);
    expect(
      screen.getByRole('button', { name: 'blocks.event.edit' })
    ).toBeInTheDocument();
  });
});
