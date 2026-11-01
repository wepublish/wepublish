import { createTheme } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import { WebsiteThemeContext } from '../website-theme';
import { GapFieldRender } from './gap.component';
import { GapValue } from './gap.field';

const renderGap = (value: GapValue | undefined = { row: 2 }) => {
  const onChange = vi.fn();

  render(
    <WebsiteThemeContext.Provider value={createTheme()}>
      <GapFieldRender
        id="gap"
        name="gap"
        field={{ type: 'gap', label: 'Gap', axes: ['row'] }}
        value={value}
        onChange={onChange}
      />
    </WebsiteThemeContext.Provider>
  );

  return { onChange, input: screen.getByRole('textbox', { name: 'Row gap' }) };
};

beforeAll(async () => {
  await i18next.use(initReactI18next).init({
    lng: 'en',
    resources: { en: { translation: {} } },
    interpolation: { escapeValue: false },
  });
});

describe('GapFieldRender', () => {
  it('takes theme units as plain numbers like padding and margin', () => {
    const { onChange, input } = renderGap();

    expect(screen.queryByRole('combobox', { name: 'Unit' })).toBeNull();
    expect((input as HTMLInputElement).value).toBe('2');

    fireEvent.change(input, { target: { value: '3' } });

    expect(onChange).toHaveBeenLastCalledWith({ row: 3 });
  });

  it('takes exact pixels when px is typed', () => {
    const { onChange, input } = renderGap();

    fireEvent.change(input, { target: { value: '12px' } });

    expect(onChange).toHaveBeenLastCalledWith({ row: '12px' });
  });

  it('steps the value with the arrow keys', () => {
    const { onChange, input } = renderGap();

    fireEvent.keyDown(input, { key: 'ArrowUp' });

    expect(onChange).toHaveBeenLastCalledWith({ row: 3 });
  });

  it('explains the units below the inputs', () => {
    const { input } = renderGap();
    const hintId = input.getAttribute('aria-describedby');

    expect(hintId).toBeTruthy();
    expect(document.getElementById(hintId ?? '')?.textContent).toMatch(
      /theme units .*Add a unit like px, rem or vh/
    );
  });
});

describe('the unit hint', () => {
  it('only shows while an input of the control has focus', () => {
    const { input } = renderGap();
    const hint = () =>
      document.getElementById(input.getAttribute('aria-describedby') ?? '');

    expect(hint()?.getAttribute('data-visible')).toBe('false');

    fireEvent.focus(input);

    expect(hint()?.getAttribute('data-visible')).toBe('true');

    fireEvent.blur(input);

    expect(hint()?.getAttribute('data-visible')).toBe('false');
  });
});
