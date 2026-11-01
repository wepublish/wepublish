import { createTheme, Theme, ThemeProvider } from '@mui/material';
import { Puck } from '@puckeditor/core';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import i18next from 'i18next';
import { ReactNode, useState } from 'react';
import { initReactI18next } from 'react-i18next';

import { WebsiteThemeContext } from '../website-theme';
import { StylingFieldRender } from './styling.component';
import {
  BreakpointStylingValue,
  StylingField,
  StylingValue,
} from './styling.field';

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

type ProvidersProps = {
  websiteTheme?: Theme;
  children: ReactNode;
};

const editorTheme = createTheme({ cssVariables: true });

const Providers = ({ websiteTheme = theme, children }: ProvidersProps) => (
  <ThemeProvider theme={editorTheme}>
    <WebsiteThemeContext.Provider value={websiteTheme}>
      <Puck
        config={{ components: {} }}
        data={{}}
      >
        {children}
      </Puck>
    </WebsiteThemeContext.Provider>
  </ThemeProvider>
);

type HarnessProps = {
  initialValue?: BreakpointStylingValue;
  field?: Partial<Omit<StylingField, 'type'>>;
  readOnly?: boolean;
  websiteTheme?: Theme;
  onChange: (value: BreakpointStylingValue | undefined) => void;
};

const StylingHarness = ({
  initialValue,
  field,
  readOnly,
  websiteTheme,
  onChange,
}: HarnessProps) => {
  const [value, setValue] = useState(initialValue);

  return (
    <Providers websiteTheme={websiteTheme}>
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
    </Providers>
  );
};

const renderBreakpointStyling = (
  props: Omit<HarnessProps, 'onChange'> = {}
) => {
  const onChange = vi.fn();

  render(
    <StylingHarness
      {...props}
      onChange={onChange}
    />
  );

  return { onChange };
};

const renderStyling = ({
  initialValue,
  ...props
}: Omit<HarnessProps, 'onChange' | 'initialValue'> & {
  initialValue?: StylingValue;
} = {}) => {
  const onChange = vi.fn();

  render(
    <StylingHarness
      {...props}
      initialValue={initialValue && { xs: initialValue }}
      onChange={next => onChange(next?.xs)}
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

    for (const group of [
      'Text',
      'Background',
      'Spacing',
      'Border',
      'Size',
      'Effects',
    ]) {
      expect(groupToggle(group).getAttribute('aria-expanded')).toBe('false');
    }

    expect(screen.queryByRole('button', { name: /^Reset/ })).toBeNull();
  });

  it('only shows the groups the field allows', () => {
    renderStyling({
      field: { groups: ['background', 'spacing', 'border', 'size', 'effects'] },
    });

    expect(screen.queryByRole('button', { name: 'Text' })).toBeNull();
    expect(screen.queryByLabelText('Typography')).toBeNull();
    expect(groupToggle('Background')).toBeTruthy();
    expect(groupToggle('Effects')).toBeTruthy();
  });

  it('keeps modified groups collapsed and offers to reset them', () => {
    renderStyling({ initialValue: { shadow: 4 } });

    expect(groupToggle('Effects').getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByRole('button', { name: 'Reset Effects' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Reset Text' })).toBeNull();
  });

  it('resets only the styles of one group', () => {
    const { onChange } = renderStyling({
      initialValue: { color: '#000000', shadow: 4, opacity: 50 },
    });

    expand('Effects');
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
    expand('Border');

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

    expand('Text');

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
    expand('Text');

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

    expand('Background');

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

    expand('Background');

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

  it('rounds all corners fully and back', () => {
    const { onChange } = renderStyling();

    expand('Border');

    const rounded = screen.getByRole('button', { name: 'Fully rounded' });

    expect(rounded.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(rounded);

    expect(onChange).toHaveBeenLastCalledWith({
      borderRadius: {
        topLeft: '9999px',
        topRight: '9999px',
        bottomRight: '9999px',
        bottomLeft: '9999px',
      },
    });
    expect(rounded.getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(rounded);

    expect(onChange).toHaveBeenLastCalledWith(undefined);
    expect(rounded.getAttribute('aria-pressed')).toBe('false');
  });

  it('shapes the corners', () => {
    const borderRadius = {
      topLeft: 2,
      topRight: 2,
      bottomRight: 2,
      bottomLeft: 2,
    };
    const { onChange } = renderStyling({ initialValue: { borderRadius } });
    expand('Border');

    const shapes = within(
      screen.getByRole('radiogroup', { name: 'Corner shape' })
    );

    expect(
      shapes
        .getAllByRole('radio')
        .map(radio => radio.getAttribute('aria-label'))
    ).toEqual([
      'Round (default)',
      'Squircle',
      'Bevel',
      'Scoop',
      'Notch',
      'Square',
    ]);
    expect(
      (
        shapes.getByRole('radio', {
          name: 'Round (default)',
        }) as HTMLInputElement
      ).checked
    ).toBe(true);

    fireEvent.click(shapes.getByRole('radio', { name: 'Squircle' }));

    expect(onChange).toHaveBeenLastCalledWith({
      borderRadius,
      cornerShape: 'squircle',
    });

    fireEvent.click(shapes.getByRole('radio', { name: 'Round (default)' }));

    expect(onChange).toHaveBeenLastCalledWith({ borderRadius });
    expect(screen.queryByText(/needs a corner radius/)).toBeNull();
  });

  it('warns that only some browsers shape the corners', () => {
    renderStyling();

    expand('Border');

    const warning = screen.getByRole('note');

    expect(warning.textContent).toMatch(
      /only work in some browsers.*normal rounded corners/
    );

    const link = within(warning).getByRole('link', { name: 'Browser support' });

    expect(link.getAttribute('href')).toBe(
      'https://caniuse.com/wf-corner-shape'
    );
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('hints that the corner shape needs a corner radius', () => {
    const { onChange } = renderStyling();

    expand('Border');

    expect(screen.getByText(/needs a corner radius/)).toBeTruthy();

    const bevel = screen.getByRole('radio', { name: 'Bevel' });

    expect((bevel as HTMLInputElement).disabled).toBe(false);

    fireEvent.click(bevel);

    expect(onChange).toHaveBeenLastCalledWith({ cornerShape: 'bevel' });
  });

  it('resets the corner shape with the border', () => {
    const { onChange } = renderStyling({
      initialValue: { cornerShape: 'notch', opacity: 50 },
    });

    expand('Border');

    expect(
      (screen.getByRole('radio', { name: 'Notch' }) as HTMLInputElement).checked
    ).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Reset Border' }));

    expect(onChange).toHaveBeenLastCalledWith({ opacity: 50 });
  });

  it('unlinks the corners when the radius stops being uniform from outside', () => {
    const onChange = vi.fn();
    const view = (value: StylingValue | undefined) => (
      <Providers>
        <StylingFieldRender
          id="styling"
          name="styling"
          field={{ type: 'styling', label: 'Styling' }}
          value={value && { xs: value }}
          onChange={next => onChange(next?.xs)}
        />
      </Providers>
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
    expand('Effects');

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

  describe('per breakpoint', () => {
    it('shows the breakpoint tabs above the groups', () => {
      renderStyling();

      expect(screen.getByRole('button', { name: 'xs' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      expect(
        screen.getByRole('button', { name: 'Add breakpoint' })
      ).toBeTruthy();
    });

    it('edits only the styling of the selected breakpoint', () => {
      const { onChange } = renderBreakpointStyling({
        initialValue: { xs: { shadow: 4 }, md: { opacity: 50 } },
      });

      fireEvent.click(screen.getByRole('button', { name: 'md' }));
      expand('Text');
      fireEvent.change(screen.getByRole('combobox', { name: 'Typography' }), {
        target: { value: 'h2' },
      });

      expect(onChange).toHaveBeenLastCalledWith({
        xs: { shadow: 4 },
        md: { opacity: 50, typography: 'h2' },
      });
    });

    it('only shows what is set on the selected breakpoint', () => {
      renderBreakpointStyling({
        initialValue: { xs: { typography: 'h2', opacity: 30 }, md: {} },
      });

      fireEvent.click(screen.getByRole('button', { name: 'md' }));
      expand('Text');
      expand('Effects');

      expect(
        (
          screen.getByRole('combobox', {
            name: 'Typography',
          }) as HTMLSelectElement
        ).value
      ).toBe('');
      expect(
        screen
          .getByRole('slider', { name: 'Opacity' })
          .getAttribute('aria-valuenow')
      ).not.toBe('30');
      expect(
        screen.queryByRole('button', { name: 'Reset Effects' })
      ).toBeNull();
    });

    it('resets a group of a larger breakpoint', () => {
      const { onChange } = renderBreakpointStyling({
        initialValue: { xs: { opacity: 30 }, md: { opacity: 50, shadow: 2 } },
      });

      fireEvent.click(screen.getByRole('button', { name: 'md' }));
      expand('Effects');
      fireEvent.click(screen.getByRole('button', { name: 'Reset Effects' }));

      expect(onChange).toHaveBeenLastCalledWith({
        xs: { opacity: 30 },
        md: {},
      });
      expect(
        screen
          .getByRole('slider', { name: 'Opacity' })
          .getAttribute('aria-valuenow')
      ).not.toBe('30');
    });

    it('adds an empty breakpoint', () => {
      const { onChange } = renderBreakpointStyling({
        initialValue: { xs: { opacity: 30 }, md: { typography: 'h2' } },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Add breakpoint' }));
      fireEvent.click(screen.getByRole('menuitem', { name: /lg/ }));

      expect(onChange).toHaveBeenLastCalledWith({
        xs: { opacity: 30 },
        md: { typography: 'h2' },
        lg: {},
      });
      expect(screen.getByRole('button', { name: 'lg' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });

    it('removes a breakpoint', () => {
      const { onChange } = renderBreakpointStyling({
        initialValue: { xs: { opacity: 30 }, md: { opacity: 50 } },
      });

      fireEvent.click(
        screen.getByRole('button', { name: 'Remove md breakpoint' })
      );

      expect(onChange).toHaveBeenLastCalledWith({ xs: { opacity: 30 } });
    });

    it('keeps the groups the field allows on every breakpoint', () => {
      renderBreakpointStyling({
        initialValue: { xs: {}, md: {} },
        field: { groups: ['spacing'] },
      });

      fireEvent.click(screen.getByRole('button', { name: 'md' }));

      expect(screen.queryByRole('button', { name: 'Text' })).toBeNull();
      expect(groupToggle('Spacing')).toBeTruthy();
    });
  });
});
