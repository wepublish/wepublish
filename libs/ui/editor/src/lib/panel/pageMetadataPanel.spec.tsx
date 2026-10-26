import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render as rtlRender, screen } from '@testing-library/react';
import { ComponentType, ReactElement } from 'react';

import { PageMetadata, PageMetadataPanel } from './pageMetadataPanel';

// Translate to the raw key so assertions stay deterministic and locale-agnostic.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('../atoms', async importOriginal => ({
  ...(await importOriginal<typeof import('../atoms')>()),
  createCheckedPermissionComponent:
    () =>
    <P extends object>(Component: ComponentType<P>) =>
      Component,
  useAuthorisation: () => true,
  SelectTags: () => null,
  ChooseEditImage: () => null,
}));

const metadata: PageMetadata = {
  slug: 'foo',
  title: 'Foo',
  description: '',
  seoTitle: '',
  seoDescription: '',
  tags: [],
  defaultTags: [],
  url: '',
  properties: [],
};

const theme = createTheme({ cssVariables: true });
const render = (ui: ReactElement) =>
  rtlRender(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const getCheckbox = (key: 'hideHeader' | 'hideFooter') =>
  screen.getByRole<HTMLInputElement>('checkbox', {
    name: new RegExp(`^pageEditor\\.panels\\.${key}\\b`),
  });

describe('PageMetadataPanel', () => {
  it('shows header and footer by default', () => {
    render(<PageMetadataPanel value={metadata} />);

    expect(getCheckbox('hideHeader').checked).toBe(false);
    expect(getCheckbox('hideFooter').checked).toBe(false);
  });

  it('reflects a page that hides only the header', () => {
    render(<PageMetadataPanel value={{ ...metadata, hideHeader: true }} />);

    expect(getCheckbox('hideHeader').checked).toBe(true);
    expect(getCheckbox('hideFooter').checked).toBe(false);
  });

  it('reflects a page that hides only the footer', () => {
    render(<PageMetadataPanel value={{ ...metadata, hideFooter: true }} />);

    expect(getCheckbox('hideHeader').checked).toBe(false);
    expect(getCheckbox('hideFooter').checked).toBe(true);
  });

  it('labels the key and value of every property', () => {
    render(
      <PageMetadataPanel
        value={{
          ...metadata,
          properties: [{ key: 'color', value: 'red', public: true }],
        }}
      />
    );

    fireEvent.click(
      screen.getByRole('tab', { name: 'pageEditor.panels.properties' })
    );

    expect(
      screen.getByRole('textbox', { name: 'pageEditor.panels.key' })
    ).toHaveValue('color');
    expect(
      screen.getByRole('textbox', { name: 'pageEditor.panels.value' })
    ).toHaveValue('red');
  });

  it.each(['hideHeader', 'hideFooter'] as const)(
    'emits only %s when toggled',
    key => {
      const onChange = vi.fn();
      render(
        <PageMetadataPanel
          value={metadata}
          onChange={onChange}
        />
      );

      fireEvent.click(getCheckbox(key));

      expect(onChange).toHaveBeenCalledWith({
        ...metadata,
        [key]: true,
      });
    }
  );
});
