import { createTheme } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { useState } from 'react';
import { initReactI18next } from 'react-i18next';

import { Side, SidesValue } from '../sides/sides';
import { WebsiteThemeContext } from '../website-theme';
import { BoxModelInput } from './box-model.component';

const theme = createTheme();

type HarnessProps = {
  margin?: SidesValue;
  padding?: SidesValue;
  marginSides?: Side[];
  readOnly?: boolean;
  onMarginChange: (value: SidesValue) => void;
  onPaddingChange: (value: SidesValue) => void;
};

const BoxModelHarness = ({
  margin: initialMargin,
  padding: initialPadding,
  marginSides,
  readOnly,
  onMarginChange,
  onPaddingChange,
}: HarnessProps) => {
  const [margin, setMargin] = useState(initialMargin);
  const [padding, setPadding] = useState(initialPadding);

  return (
    <WebsiteThemeContext.Provider value={theme}>
      <BoxModelInput
        name="css-spacing"
        margin={margin}
        padding={padding}
        marginSides={marginSides}
        readOnly={readOnly}
        onMarginChange={next => {
          setMargin(next);
          onMarginChange(next);
        }}
        onPaddingChange={next => {
          setPadding(next);
          onPaddingChange(next);
        }}
      />
    </WebsiteThemeContext.Provider>
  );
};

const renderBoxModel = (
  props: Omit<HarnessProps, 'onMarginChange' | 'onPaddingChange'> = {}
) => {
  const onMarginChange = vi.fn();
  const onPaddingChange = vi.fn();

  render(
    <BoxModelHarness
      {...props}
      onMarginChange={onMarginChange}
      onPaddingChange={onPaddingChange}
    />
  );

  return { onMarginChange, onPaddingChange };
};

const input = (name: string) => screen.getByRole('textbox', { name });

beforeAll(async () => {
  await i18next.use(initReactI18next).init({
    lng: 'en',
    resources: { en: { translation: {} } },
    interpolation: { escapeValue: false },
  });
});

describe('BoxModelInput', () => {
  it('renders one input per side for margin and padding', () => {
    renderBoxModel({ margin: { top: 2 }, padding: { left: '12px' } });

    expect(screen.getByRole('group', { name: 'Margin' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Padding' })).toBeTruthy();
    expect((input('Margin top') as HTMLInputElement).value).toBe('2');
    expect((input('Padding left') as HTMLInputElement).value).toBe('12px');
    expect((input('Padding right') as HTMLInputElement).value).toBe('');
  });

  it('sets every side at once while the sides are linked', () => {
    const { onPaddingChange } = renderBoxModel();

    expect(
      screen
        .getByRole('button', { name: 'Link padding sides' })
        .getAttribute('aria-pressed')
    ).toBe('true');

    fireEvent.change(input('Padding top'), { target: { value: '2' } });

    expect(onPaddingChange).toHaveBeenLastCalledWith({
      top: 2,
      right: 2,
      bottom: 2,
      left: 2,
    });
  });

  it('sets a single side once the sides are unlinked', () => {
    const { onMarginChange } = renderBoxModel({
      margin: { top: 1, right: 1, bottom: 1, left: 1 },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Link margin sides' }));
    fireEvent.change(input('Margin left'), { target: { value: '12px' } });

    expect(onMarginChange).toHaveBeenLastCalledWith({
      top: 1,
      right: 1,
      bottom: 1,
      left: '12px',
    });
  });

  it('unifies differing sides when linking them', () => {
    const { onMarginChange } = renderBoxModel({
      margin: { top: 3, bottom: 1 },
    });
    const link = screen.getByRole('button', { name: 'Link margin sides' });

    expect(link.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(link);

    expect(onMarginChange).toHaveBeenLastCalledWith({
      top: 3,
      right: 3,
      bottom: 3,
      left: 3,
    });
  });

  it('unlinks the sides when the value stops being uniform from outside', () => {
    const onPaddingChange = vi.fn();
    const view = (padding: SidesValue | undefined) => (
      <WebsiteThemeContext.Provider value={theme}>
        <BoxModelInput
          name="css-spacing"
          margin={undefined}
          padding={padding}
          onMarginChange={vi.fn()}
          onPaddingChange={onPaddingChange}
        />
      </WebsiteThemeContext.Provider>
    );
    const { rerender } = render(view({ top: 4 }));
    const link = () =>
      screen.getByRole('button', { name: 'Link padding sides' });

    fireEvent.click(link());
    rerender(view({ top: 4, right: 4, bottom: 4, left: 4 }));

    expect(link().getAttribute('aria-pressed')).toBe('true');

    rerender(view({ top: 4 }));

    expect(link().getAttribute('aria-pressed')).toBe('false');

    fireEvent.change(input('Padding left'), { target: { value: '1' } });

    expect(onPaddingChange).toHaveBeenLastCalledWith({ top: 4, left: 1 });
  });

  it('stays unlinked once the sides become uniform again from outside', () => {
    const onMarginChange = vi.fn();
    const view = (margin: SidesValue | undefined) => (
      <WebsiteThemeContext.Provider value={theme}>
        <BoxModelInput
          name="css-spacing"
          margin={margin}
          padding={undefined}
          onMarginChange={onMarginChange}
          onPaddingChange={vi.fn()}
        />
      </WebsiteThemeContext.Provider>
    );
    const { rerender } = render(view(undefined));
    const link = () =>
      screen.getByRole('button', { name: 'Link margin sides' });

    rerender(view({ top: 2, bottom: 2 }));

    expect(link().getAttribute('aria-pressed')).toBe('false');

    rerender(view(undefined));

    expect(link().getAttribute('aria-pressed')).toBe('false');

    fireEvent.change(input('Margin left'), { target: { value: '1' } });

    expect(onMarginChange).toHaveBeenLastCalledWith({ left: 1 });
  });

  it('clears a side when its input is emptied', () => {
    const { onPaddingChange } = renderBoxModel({
      padding: { top: 1, left: 2 },
    });

    fireEvent.change(input('Padding top'), { target: { value: '' } });

    expect(onPaddingChange).toHaveBeenLastCalledWith({ left: 2 });
  });

  it('keeps invalid input local and flags it', () => {
    const { onPaddingChange } = renderBoxModel({ padding: { top: 1 } });

    fireEvent.change(input('Padding top'), { target: { value: '2rem' } });

    expect(onPaddingChange).not.toHaveBeenCalled();
    expect(input('Padding top').getAttribute('aria-invalid')).toBe('true');

    fireEvent.blur(input('Padding top'));

    expect((input('Padding top') as HTMLInputElement).value).toBe('1');
  });

  it('steps the value with the arrow keys', () => {
    const { onPaddingChange } = renderBoxModel({
      padding: { top: 1, bottom: 2 },
    });

    fireEvent.keyDown(input('Padding top'), { key: 'ArrowUp' });

    expect(onPaddingChange).toHaveBeenLastCalledWith({ top: 2, bottom: 2 });

    fireEvent.keyDown(input('Padding bottom'), {
      key: 'ArrowDown',
      shiftKey: true,
    });

    expect(onPaddingChange).toHaveBeenLastCalledWith({ top: 2, bottom: 0 });
  });

  it('only offers the margin sides the component allows', () => {
    renderBoxModel({ marginSides: ['top', 'bottom'] });

    expect(screen.queryByRole('textbox', { name: 'Margin left' })).toBeNull();
    expect(screen.queryByRole('textbox', { name: 'Margin right' })).toBeNull();
    expect(input('Margin top')).toBeTruthy();
    expect(input('Padding left')).toBeTruthy();
  });

  it('disables every input when read only', () => {
    renderBoxModel({ readOnly: true });

    expect(input('Margin top').hasAttribute('disabled')).toBe(true);
    expect(
      screen
        .getByRole('button', { name: 'Link padding sides' })
        .hasAttribute('disabled')
    ).toBe(true);
  });
});
