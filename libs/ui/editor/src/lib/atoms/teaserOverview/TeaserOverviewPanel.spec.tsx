import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { render } from '@testing-library/react';
import { EditorBlockType, TeaserType } from '@wepublish/editor/api';

import { BlockValue } from '../../blocks/types';

import { TeaserOverviewPanel } from './TeaserOverviewPanel';

const theme = createTheme({ cssVariables: true, shape: { borderRadius: 8 } });

describe('TeaserOverviewPanel', () => {
  it('rounds the header to fit inside the panel border', () => {
    const { container } = render(
      <MockedProvider>
        <ThemeProvider theme={theme}>
          <TeaserOverviewPanel
            blocks={
              [
                {
                  key: 'grid',
                  type: EditorBlockType.TeaserGrid1,
                  value: {
                    title: '',
                    numColumns: 1,
                    teasers: [
                      [
                        't1',
                        {
                          type: TeaserType.Custom,
                          title: 'Hello',
                          image: null,
                        },
                      ],
                    ],
                  },
                },
              ] as unknown as BlockValue[]
            }
            onChange={vi.fn()}
          />
        </ThemeProvider>
      </MockedProvider>
    );

    const header = container.querySelector('button');

    expect(header).not.toBeNull();
    expect(header).toHaveStyle({ 'border-radius': 'calc(8px - 1px)' });
  });

  it('points the header at the panel it expands and exposes filter state', () => {
    const { container } = render(
      <MockedProvider>
        <ThemeProvider theme={theme}>
          <TeaserOverviewPanel
            blocks={
              [
                {
                  key: 'grid',
                  type: EditorBlockType.TeaserGrid1,
                  value: {
                    title: '',
                    numColumns: 1,
                    teasers: [
                      [
                        't1',
                        {
                          type: TeaserType.Custom,
                          title: 'Hello',
                          image: null,
                        },
                      ],
                    ],
                  },
                },
              ] as unknown as BlockValue[]
            }
            onChange={vi.fn()}
          />
        </ThemeProvider>
      </MockedProvider>
    );

    const header = container.querySelector('button[aria-expanded]');
    const controlled = document.getElementById(
      header?.getAttribute('aria-controls') ?? ''
    );

    expect(controlled).not.toBeNull();

    const filters = Array.from(
      controlled?.querySelectorAll('[role="button"]') ?? []
    ).filter(chip =>
      chip.textContent?.startsWith('teaserOverview.teaserTypes.')
    );

    expect(filters.length).toBeGreaterThan(0);
    filters.forEach(chip =>
      expect(['true', 'false']).toContain(chip.getAttribute('aria-pressed'))
    );
  });
});
