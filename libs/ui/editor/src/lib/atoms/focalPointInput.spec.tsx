import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';

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

describe('FocalPointInput keyboard and pointer alternatives', () => {
  const renderWithChange = (focalPoint = { x: 0.5, y: 0.5 }) => {
    const onChange = vi.fn();

    render(
      <ThemeProvider theme={theme}>
        <FocalPointInput
          imageURL="https://example.com/image.jpg"
          imageWidth={1200}
          imageHeight={800}
          maxHeight={300}
          focalPoint={focalPoint}
          onChange={onChange}
        />
      </ThemeProvider>
    );

    return onChange;
  };

  it('exposes the focal point as a named, focusable control', () => {
    renderWithChange();

    const point = screen.getByRole('slider', {
      name: 'images.panels.focalPoint',
    });

    expect(point).toHaveAttribute('tabindex', '0');
    expect(point).toHaveAttribute('aria-valuetext');
  });

  it('moves the point with the arrow keys', () => {
    const onChange = renderWithChange();
    const point = screen.getByRole('slider');

    fireEvent.keyDown(point, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith({ x: 0.55, y: 0.5 });

    fireEvent.keyDown(point, { key: 'ArrowUp' });
    expect(onChange).toHaveBeenLastCalledWith({ x: 0.5, y: 0.45 });
  });

  it('moves the point in finer steps with Shift', () => {
    const onChange = renderWithChange();

    fireEvent.keyDown(screen.getByRole('slider'), {
      key: 'ArrowDown',
      shiftKey: true,
    });

    expect(onChange).toHaveBeenLastCalledWith({ x: 0.5, y: 0.51 });
  });

  it('keeps the point inside the image', () => {
    const onChange = renderWithChange({ x: 0.98, y: 0 });
    const point = screen.getByRole('slider');

    fireEvent.keyDown(point, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith({ x: 1, y: 0 });

    fireEvent.keyDown(point, { key: 'ArrowUp' });
    expect(onChange).toHaveBeenLastCalledWith({ x: 0.98, y: 0 });
  });

  it('places the point where the image is clicked', () => {
    const onChange = renderWithChange();
    const area = screen.getByRole('slider').parentElement as HTMLElement;

    Object.defineProperties(area, {
      clientWidth: { value: 200, configurable: true },
      clientHeight: { value: 100, configurable: true },
    });
    area.getBoundingClientRect = () =>
      ({ left: 10, top: 20, width: 200, height: 100 }) as DOMRect;

    fireEvent.click(area, { clientX: 60, clientY: 95 });

    expect(onChange).toHaveBeenLastCalledWith({ x: 0.25, y: 0.75 });
  });
});

describe('FocalPointInput', () => {
  it('lets the image fill the box the marker is dragged in', () => {
    renderInput();

    const image = screen.getByRole('presentation');

    expect(image).toHaveStyle({ width: '100%', height: '100%' });
    expect(image.parentElement).toHaveStyle({ padding: '0' });
  });
});
