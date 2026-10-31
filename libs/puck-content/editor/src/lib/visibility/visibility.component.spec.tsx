import { createTheme, Theme } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import i18next from 'i18next';
import { useState } from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import { WebsiteThemeContext } from '../website-theme';
import { VisibilityFieldRender } from './visibility.component';
import { VisibilityField, VisibilityValue } from './visibility.field';

const i18n = i18next.createInstance();

void i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {},
  initImmediate: false,
  interpolation: { escapeValue: false },
});

type HarnessProps = {
  initialValue?: VisibilityValue;
  field?: Partial<Omit<VisibilityField, 'type'>>;
  readOnly?: boolean;
  theme?: Theme;
  onChange: (value: VisibilityValue | undefined) => void;
};

const VisibilityFieldHarness = ({
  initialValue,
  field,
  readOnly,
  theme = createTheme(),
  onChange,
}: HarnessProps) => {
  const [value, setValue] = useState(initialValue);

  return (
    <I18nextProvider i18n={i18n}>
      <WebsiteThemeContext.Provider value={theme}>
        <VisibilityFieldRender
          id="visibility"
          name="visibility"
          field={{ type: 'visibility', label: 'Visibility', ...field }}
          value={value}
          readOnly={readOnly}
          onChange={next => {
            setValue(next);
            onChange(next);
          }}
        />
      </WebsiteThemeContext.Provider>
    </I18nextProvider>
  );
};

const renderField = (props: Omit<HarnessProps, 'onChange'> = {}) => {
  const onChange = vi.fn();

  render(
    <VisibilityFieldHarness
      {...props}
      onChange={onChange}
    />
  );

  return { onChange };
};

const checkbox = (name: string) => screen.getByRole('checkbox', { name });

describe('VisibilityFieldRender', () => {
  it('offers each theme breakpoint with its width, all shown', () => {
    renderField();

    const group = screen.getByRole('group', { name: 'Visibility' });

    expect(
      within(group)
        .getAllByRole('checkbox')
        .map(input => input.getAttribute('aria-label'))
    ).toEqual([
      'xs · 0–599px',
      'sm · 600–899px',
      'md · 900–1199px',
      'lg · 1200–1535px',
      'xl · 1536px+',
    ]);
    expect(
      within(group)
        .getAllByRole('checkbox')
        .every(input => (input as HTMLInputElement).checked)
    ).toBe(true);
    expect(within(group).getByText('Shown on all screen sizes')).toBeTruthy();
    expect(
      within(group).queryByRole('button', { name: 'All sizes' })
    ).toBeNull();
  });

  it('hides the component on a breakpoint that gets unchecked', () => {
    const { onChange } = renderField();

    fireEvent.click(checkbox('md · 900–1199px'));

    expect(onChange).toHaveBeenLastCalledWith(['xs', 'sm', 'lg', 'xl']);
    expect((checkbox('md · 900–1199px') as HTMLInputElement).checked).toBe(
      false
    );
    expect(screen.getByText('Hidden on md')).toBeTruthy();
  });

  it('summarises the hidden breakpoints and shows all of them again', () => {
    const { onChange } = renderField({ initialValue: ['xl', 'xs', 'sm'] });

    expect(screen.getByText('Hidden on md, lg')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'All sizes' }));

    expect(onChange).toHaveBeenLastCalledWith(undefined);
    expect((checkbox('lg · 1200–1535px') as HTMLInputElement).checked).toBe(
      true
    );
    expect(screen.getByText('Shown on all screen sizes')).toBeTruthy();
  });

  it('keeps focus on the breakpoint list once all sizes are shown', () => {
    renderField({ initialValue: ['xs'] });

    const showAll = screen.getByRole('button', { name: 'All sizes' });

    showAll.focus();
    fireEvent.click(showAll);

    expect(screen.queryByRole('button', { name: 'All sizes' })).toBeNull();
    expect(checkbox('xs · 0–599px')).toHaveFocus();
  });

  it('goes back to showing everywhere once every breakpoint is checked', () => {
    const { onChange } = renderField({
      initialValue: ['xs', 'sm', 'lg', 'xl'],
    });

    fireEvent.click(checkbox('md · 900–1199px'));

    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  it('says when the component is hidden on every screen size', () => {
    renderField({ initialValue: [] });

    expect(screen.getByText('Hidden on all screen sizes')).toBeTruthy();
  });

  it('uses the breakpoints of the website theme', () => {
    renderField({
      theme: createTheme({
        breakpoints: {
          values: { xs: 0, sm: 480, md: 768, lg: 1024, xl: 1440 },
        },
      }),
    });

    expect(checkbox('sm · 480–767px')).toBeTruthy();
    expect(checkbox('xl · 1440px+')).toBeTruthy();
  });

  it('falls back to a label of its own', () => {
    renderField({ field: { label: undefined } });

    expect(screen.getByRole('group', { name: 'Screen sizes' })).toBeTruthy();
  });

  it('cannot be changed while read only', () => {
    renderField({ initialValue: ['xs'], readOnly: true });

    expect(
      screen
        .getAllByRole('checkbox')
        .every(input => (input as HTMLInputElement).disabled)
    ).toBe(true);
    expect(screen.queryByRole('button', { name: 'All sizes' })).toBeNull();
  });
});
