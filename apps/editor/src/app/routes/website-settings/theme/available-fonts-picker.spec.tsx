import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, within } from '@testing-library/react';

import { AvailableFontsPicker } from './available-fonts-picker';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: () => ({
    data: { websiteSettings: { fonts: [{ name: 'Fraunces' }] } },
    loading: false,
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

describe('AvailableFontsPicker', () => {
  it('takes its name from the given label', () => {
    const label = 'websiteSettings.theme.typography.fontFamily';

    render(
      <>
        <span id="font-label">{label}</span>
        <AvailableFontsPicker
          name="fontFamily"
          value=""
          labelId="font-label"
          onChange={() => undefined}
          onBlur={() => undefined}
        />
      </>
    );

    expect(screen.getByRole('combobox', { name: label })).toBeInTheDocument();
  });

  it('shows the bare font name of a quoted css value and keeps the value', () => {
    const onChange = vi.fn();

    render(
      <AvailableFontsPicker
        name="fontFamily"
        value="'Fraunces', Georgia, serif"
        onChange={onChange}
        onBlur={() => undefined}
      />
    );

    expect(screen.getByRole('combobox')).toHaveTextContent(/^Fraunces$/);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('stores the picked font as a css font family', () => {
    const onChange = vi.fn();

    render(
      <AvailableFontsPicker
        name="fontFamily"
        value=""
        onChange={onChange}
        onBlur={() => undefined}
      />
    );

    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(
      within(screen.getByRole('listbox')).getByRole('option', {
        name: 'Fraunces',
      })
    );

    expect(onChange).toHaveBeenCalledWith(
      '"Fraunces", Helvetica, Arial, sans-serif'
    );
  });
});
