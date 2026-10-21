import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';

import { FocalPointInput } from './focalPointInput';

const theme = createTheme({ cssVariables: true });

const renderInput = () =>
  render(
    <ThemeProvider theme={theme}>
      <FocalPointInput
        imageURL="https://example.com/image.jpg"
        imageWidth={1200}
        imageHeight={800}
        maxHeight={300}
        focalPoint={{ x: 0.5, y: 0.5 }}
      />
    </ThemeProvider>
  );

describe('FocalPointInput', () => {
  it('lets the image fill the box the marker is dragged in', () => {
    renderInput();

    const image = screen.getByRole('presentation');

    expect(image).toHaveStyle({ width: '100%', height: '100%' });
    expect(image.parentElement).toHaveStyle({ padding: '0' });
  });
});
