import { fireEvent, render, screen } from '@testing-library/react';
import { ComponentType } from 'react';

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

const getToggle = () =>
  screen.getByRole<HTMLInputElement>('switch', {
    name: /^pageEditor\.panels\.hideHeaderFooter\b/,
  });

describe('PageMetadataPanel', () => {
  it('shows header and footer by default', () => {
    render(<PageMetadataPanel value={metadata} />);

    expect(getToggle().checked).toBe(false);
  });

  it('reflects a page that hides header and footer', () => {
    render(
      <PageMetadataPanel value={{ ...metadata, hideHeaderFooter: true }} />
    );

    expect(getToggle().checked).toBe(true);
  });

  it('emits hideHeaderFooter when toggled', () => {
    const onChange = vi.fn();
    render(
      <PageMetadataPanel
        value={metadata}
        onChange={onChange}
      />
    );

    fireEvent.click(getToggle());

    expect(onChange).toHaveBeenCalledWith({
      ...metadata,
      hideHeaderFooter: true,
    });
  });
});
