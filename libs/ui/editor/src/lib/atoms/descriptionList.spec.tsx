import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';

import { DescriptionList, DescriptionListItem } from './descriptionList';

const theme = createTheme({ cssVariables: true });

const LONG_URL =
  'https://media.example.com/cbecb738-d5ca-48b2-bb97-e1637c5fbfe3?quality=80&sig=zo8jJffHIydfp_DmoawkQzx9jegkAIOgILeYKUvIbPMybZz3wduzRnC';

describe('DescriptionList', () => {
  it('stays inside the column it is given', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <div style={{ width: '300px' }}>
          <DescriptionList>
            <DescriptionListItem label="Link">{LONG_URL}</DescriptionListItem>
          </DescriptionList>
        </div>
      </ThemeProvider>
    );

    const list = container.querySelector('dl') as HTMLElement;

    expect(getComputedStyle(list).display).toBe('grid');
    expect(getComputedStyle(list).gridTemplateColumns).toContain('minmax(0');
  });

  it('pairs each label with its value', () => {
    render(
      <ThemeProvider theme={theme}>
        <DescriptionList>
          <DescriptionListItem label="File size">1.2 MB</DescriptionListItem>
        </DescriptionList>
      </ThemeProvider>
    );

    expect(screen.getByText('File size')).toBeInTheDocument();
    expect(screen.getByText('1.2 MB')).toBeInTheDocument();
  });
});
