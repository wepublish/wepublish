import { createTheme, Theme } from '@mui/material';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import i18next from 'i18next';
import { useState } from 'react';
import { initReactI18next } from 'react-i18next';

import { WebsiteThemeContext } from '../website-theme';
import { StylingFieldRender } from './styling.component';
import { StylingField, StylingValue } from './styling.field';

vi.mock('../color/color.component', () => ({
  ColorFieldRender: ({
    field,
    value,
    onChange,
  }: {
    field: { label?: string };
    value?: string;
    onChange: (value: string | undefined) => void;
  }) => (
    <button
      type="button"
      onClick={() => onChange(value ? undefined : '#123456')}
    >
      {`${field.label}: ${value ?? 'Default'}`}
    </button>
  ),
}));

vi.mock('../image/image.component', () => ({
  ImagePicker: ({
    value,
    onChange,
  }: {
    value?: string;
    onChange: (value: string | undefined) => void;
  }) => (
    <button
      type="button"
      onClick={() => onChange(value ? undefined : 'image-1')}
    >
      {value ? `Remove image ${value}` : 'Choose image'}
    </button>
  ),
}));

const theme = createTheme();

type HarnessProps = {
  initialValue?: StylingValue;
  field?: Partial<Omit<StylingField, 'type'>>;
  readOnly?: boolean;
  websiteTheme?: Theme;
  onChange: (value: StylingValue | undefined) => void;
};

const StylingHarness = ({
  initialValue,
  field,
  readOnly,
  websiteTheme = theme,
  onChange,
}: HarnessProps) => {
  const [value, setValue] = useState(initialValue);

  return (
    <WebsiteThemeContext.Provider value={websiteTheme}>
      <StylingFieldRender
        id="styling"
        name="styling"
        field={{ type: 'styling', label: 'Styling', ...field }}
        value={value}
        readOnly={readOnly}
        onChange={next => {
          setValue(next);
          onChange(next);
        }}
      />
    </WebsiteThemeContext.Provider>
  );
};

const renderStyling = (props: Omit<HarnessProps, 'onChange'> = {}) => {
  const onChange = vi.fn();

  render(
    <StylingHarness
      {...props}
      onChange={onChange}
    />
  );

  return { onChange };
};

const groupToggle = (name: string) => screen.getByRole('button', { name });

const expand = (name: string) => {
  if (groupToggle(name).getAttribute('aria-expanded') !== 'true') {
    fireEvent.click(groupToggle(name));
  }
};

beforeAll(async () => {
  await i18next.use(initReactI18next).init({
    lng: 'en',
    resources: { en: { translation: {} } },
    interpolation: { escapeValue: false },
  });
});

describe('StylingFieldRender', () => {
  it('groups the styles into collapsible sections', () => {
    renderStyling();

    expect(screen.getByRole('group', { name: 'Styling' })).toBeTruthy();

    for (const [group, expanded] of [
      ['Text', 'true'],
      ['Background', 'true'],
      ['Spacing', 'false'],
      ['Border', 'false'],
      ['Size', 'false'],
      ['Effects', 'false'],
    ]) {
      expect(groupToggle(group).getAttribute('aria-expanded')).toBe(expanded);
    }

    expect(screen.queryByRole('button', { name: /^Reset/ })).toBeNull();
  });

  it('expands modified groups and offers to reset them', () => {
    renderStyling({ initialValue: { shadow: 4 } });

    expect(groupToggle('Effects').getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('button', { name: 'Reset Effects' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Reset Text' })).toBeNull();
  });

  it('resets only the styles of one group', () => {
    const { onChange } = renderStyling({
      initialValue: { color: '#000000', shadow: 4, opacity: 50 },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Reset Effects' }));

    expect(onChange).toHaveBeenLastCalledWith({ color: '#000000' });
    expect(screen.queryByRole('button', { name: 'Reset Effects' })).toBeNull();
    expect(groupToggle('Effects').getAttribute('aria-expanded')).toBe('true');
  });

  it('moves focus to the group header after resetting it', () => {
    renderStyling({ initialValue: { shadow: 4 } });

    const reset = screen.getByRole('button', { name: 'Reset Effects' });

    act(() => reset.focus());
    fireEvent.click(reset);

    expect(screen.queryByRole('button', { name: 'Reset Effects' })).toBeNull();
    expect(document.activeElement).toBe(groupToggle('Effects'));
  });

  it('clears the whole value when the last group is reset', () => {
    const { onChange } = renderStyling({ initialValue: { opacity: 50 } });

    fireEvent.click(screen.getByRole('button', { name: 'Reset Effects' }));

    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  it('resets the controls that keep their own state', () => {
    renderStyling({ initialValue: { border: { width: { top: 1 } } } });

    const borderSwitch = () =>
      screen.getByRole('switch', { name: 'Border' }) as HTMLInputElement;

    expect(borderSwitch().checked).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Reset Border' }));

    expect(borderSwitch().checked).toBe(false);
  });

  it('hides the reset buttons when read only', () => {
    renderStyling({ initialValue: { opacity: 50 }, readOnly: true });

    expect(screen.queryByRole('button', { name: 'Reset Effects' })).toBeNull();
  });

  it('sets the text styles', () => {
    const { onChange } = renderStyling();

    fireEvent.change(screen.getByRole('combobox', { name: 'Typography' }), {
      target: { value: 'h2' },
    });

    expect(onChange).toHaveBeenLastCalledWith({ typography: 'h2' });

    fireEvent.click(screen.getByRole('radio', { name: 'Bold' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Uppercase' }));

    expect(onChange).toHaveBeenLastCalledWith({
      typography: 'h2',
      fontWeight: 'bold',
      textTransform: 'uppercase',
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Text colour: Default' })
    );

    expect(onChange).toHaveBeenLastCalledWith({
      typography: 'h2',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      color: '#123456',
    });
  });

  it('names the typography variants', () => {
    renderStyling();

    const select = screen.getByRole('combobox', { name: 'Typography' });

    expect(
      within(select).getByRole('option', { name: /^Heading 1/ })
    ).toBeTruthy();
    expect(
      within(select).getByRole('option', { name: /^Subtitle 2/ })
    ).toBeTruthy();
    expect(
      within(select).queryByRole('option', { name: /^Inherit/ })
    ).toBeNull();
  });

  it('shows the image settings once a background image is chosen', () => {
    const { onChange } = renderStyling();

    expect(screen.queryByRole('radiogroup', { name: 'Position' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Choose image' }));

    expect(
      (screen.getByRole('radio', { name: 'Centre' }) as HTMLInputElement)
        .checked
    ).toBe(true);
    expect(
      (screen.getByRole('radio', { name: 'Cover' }) as HTMLInputElement).checked
    ).toBe(true);

    fireEvent.click(screen.getByRole('radio', { name: 'Top right' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Contain' }));

    expect(onChange).toHaveBeenLastCalledWith({
      backgroundImage: 'image-1',
      backgroundPosition: 'right top',
      backgroundSize: 'contain',
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Remove image image-1' })
    );

    expect(onChange).toHaveBeenLastCalledWith(undefined);
    expect(screen.queryByRole('radiogroup', { name: 'Position' })).toBeNull();
  });

  it('adds an overlay with an adjustable opacity', () => {
    const { onChange } = renderStyling();

    expect(
      screen.queryByRole('slider', { name: 'Overlay opacity' })
    ).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Overlay: Default' }));

    const slider = screen.getByRole('slider', { name: 'Overlay opacity' });

    expect(slider.getAttribute('aria-valuenow')).toBe('50');

    fireEvent.change(slider, { target: { value: '30' } });

    expect(onChange).toHaveBeenLastCalledWith({
      overlay: '#123456',
      overlayOpacity: 30,
    });
  });

  it('edits margin and padding in the box model', () => {
    const { onChange } = renderStyling({
      field: { marginSides: ['top', 'bottom'] },
    });

    expand('Spacing');

    expect(screen.queryByRole('textbox', { name: 'Margin left' })).toBeNull();

    fireEvent.change(screen.getByRole('textbox', { name: 'Padding top' }), {
      target: { value: '2' },
    });

    expect(onChange).toHaveBeenLastCalledWith({
      padding: { top: 2, right: 2, bottom: 2, left: 2 },
    });
  });

  it('rounds the corners', () => {
    const { onChange } = renderStyling();

    expand('Border');

    fireEvent.change(screen.getByRole('textbox', { name: 'Top left radius' }), {
      target: { value: '2' },
    });

    expect(onChange).toHaveBeenLastCalledWith({
      borderRadius: { topLeft: 2, topRight: 2, bottomRight: 2, bottomLeft: 2 },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Link corners' }));
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Bottom right radius' }),
      { target: { value: '8px' } }
    );

    expect(onChange).toHaveBeenLastCalledWith({
      borderRadius: {
        topLeft: 2,
        topRight: 2,
        bottomRight: '8px',
        bottomLeft: 2,
      },
    });
  });

  it('unlinks the corners when the radius stops being uniform from outside', () => {
    const onChange = vi.fn();
    const view = (value: StylingValue | undefined) => (
      <WebsiteThemeContext.Provider value={theme}>
        <StylingFieldRender
          id="styling"
          name="styling"
          field={{ type: 'styling', label: 'Styling' }}
          value={value}
          onChange={onChange}
        />
      </WebsiteThemeContext.Provider>
    );
    const { rerender } = render(view(undefined));
    const link = () => screen.getByRole('button', { name: 'Link corners' });

    expand('Border');

    expect(link().getAttribute('aria-pressed')).toBe('true');

    rerender(view({ borderRadius: { topLeft: 2 } }));

    expect(link().getAttribute('aria-pressed')).toBe('false');

    fireEvent.change(
      screen.getByRole('textbox', { name: 'Top right radius' }),
      { target: { value: '1' } }
    );

    expect(onChange).toHaveBeenLastCalledWith({
      borderRadius: { topLeft: 2, topRight: 1 },
    });
  });

  it('limits the size', () => {
    const { onChange } = renderStyling();

    expand('Size');

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Min height' }), {
      target: { value: '50' },
    });
    fireEvent.change(
      screen.getByRole('combobox', { name: 'Min height unit' }),
      { target: { value: 'vh' } }
    );

    expect(onChange).toHaveBeenLastCalledWith({ minHeight: '50vh' });

    fireEvent.change(screen.getByRole('combobox', { name: 'Max width' }), {
      target: { value: 'md' },
    });

    expect(onChange).toHaveBeenLastCalledWith({
      minHeight: '50vh',
      maxWidth: 'md',
    });
    expect(
      screen.queryByRole('spinbutton', { name: 'Custom max width' })
    ).toBeNull();

    fireEvent.change(screen.getByRole('combobox', { name: 'Max width' }), {
      target: { value: 'custom' },
    });

    expect(onChange).toHaveBeenLastCalledWith({
      minHeight: '50vh',
      maxWidth: '100%',
    });

    fireEvent.change(
      screen.getByRole('spinbutton', { name: 'Custom max width' }),
      { target: { value: '640' } }
    );
    fireEvent.change(
      screen.getByRole('combobox', { name: 'Custom max width unit' }),
      { target: { value: 'px' } }
    );

    expect(onChange).toHaveBeenLastCalledWith({
      minHeight: '50vh',
      maxWidth: '640px',
    });

    fireEvent.change(
      screen.getByRole('spinbutton', { name: 'Custom max width' }),
      { target: { value: '' } }
    );

    expect(onChange).toHaveBeenLastCalledWith({ minHeight: '50vh' });
    expect(
      (
        screen.getByRole('spinbutton', {
          name: 'Custom max width',
        }) as HTMLInputElement
      ).value
    ).toBe('');
  });

  it('picks a theme shadow and the opacity', () => {
    const { onChange } = renderStyling();

    expand('Effects');

    fireEvent.click(screen.getByRole('radio', { name: 'Elevation 4' }));

    expect(onChange).toHaveBeenLastCalledWith({ shadow: 4 });

    fireEvent.click(screen.getByRole('radio', { name: 'Elevation 4' }));

    expect(onChange).toHaveBeenLastCalledWith(undefined);

    const opacity = screen.getByRole('slider', { name: 'Opacity' });

    expect(opacity.getAttribute('aria-valuenow')).toBe('100');

    fireEvent.change(opacity, { target: { value: '60' } });

    expect(onChange).toHaveBeenLastCalledWith({ opacity: 60 });
  });

  it('previews the shadows on the website surfaces', () => {
    const websiteTheme = createTheme({
      palette: { background: { default: '#102030', paper: '#405060' } },
    });

    renderStyling({ initialValue: { shadow: 4 }, websiteTheme });

    const option = screen
      .getByRole('radio', { name: 'Elevation 4' })
      .closest('label');
    const sample = Array.from(option?.querySelectorAll('span') ?? []).find(
      element => getComputedStyle(element).boxShadow === websiteTheme.shadows[4]
    );

    expect(sample).toBeTruthy();
    expect(getComputedStyle(sample as HTMLElement).backgroundColor).toBe(
      websiteTheme.palette.background.paper
    );
    expect(
      getComputedStyle(sample?.parentElement as HTMLElement).backgroundColor
    ).toBe(websiteTheme.palette.background.default);
  });
});
