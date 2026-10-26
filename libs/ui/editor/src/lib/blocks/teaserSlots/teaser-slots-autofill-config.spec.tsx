import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { TeaserType } from '@wepublish/editor/api';

import { TeaserSlotsAutofillConfigPanel } from './teaser-slots-autofill-config';

const theme = createTheme({ cssVariables: true });

describe('TeaserSlotsAutofillConfigPanel', () => {
  it('labels the teaser type select with its visible label', () => {
    render(
      <MockedProvider>
        <ThemeProvider theme={theme}>
          <TeaserSlotsAutofillConfigPanel
            config={{ enabled: true, teaserType: TeaserType.Article }}
            onChange={vi.fn()}
          />
        </ThemeProvider>
      </MockedProvider>
    );

    expect(
      screen.getByRole('combobox', {
        name: /^blocks\.teaserSlots\.autofillType/,
      })
    ).toBeInTheDocument();
  });

  it('names the tags filter after its visible label', () => {
    render(
      <MockedProvider>
        <ThemeProvider theme={theme}>
          <TeaserSlotsAutofillConfigPanel
            config={{ enabled: true, teaserType: TeaserType.Article }}
            onChange={vi.fn()}
          />
        </ThemeProvider>
      </MockedProvider>
    );

    expect(
      screen.getByRole('combobox', { name: 'blocks.teaserSlots.filter' })
    ).toBeInTheDocument();
  });
});
