import { screen } from '@testing-library/react';
import {
  applyTenantTranslations,
  mockGoodie,
  renderWithProviders,
  resetTranslations,
} from '@wepublish/mocks/website';
import { t } from 'i18next';

import { zwoelfTenant } from '../zwoelf-tenant';
import { ZwoelfGoodiePicker } from './zwoelf-goodie-picker';

const booklet = mockGoodie({ name: 'Booklet NLA-Legenden' });
const mug = mockGoodie({ name: 'Tasse' });

describe('ZwoelfGoodiePicker', () => {
  beforeAll(() => applyTenantTranslations(zwoelfTenant));
  afterAll(() => resetTranslations());

  it('includes the only goodie without asking', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <ZwoelfGoodiePicker
        goodies={[booklet]}
        value={null}
        onChange={onChange}
      />,
      { tenant: zwoelfTenant }
    );

    expect(screen.getByText('Inkl. Booklet NLA-Legenden')).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(booklet.id);
  });

  it('lets the reader choose when several goodies are available', () => {
    renderWithProviders(
      <ZwoelfGoodiePicker
        goodies={[booklet, mug]}
        value={null}
        onChange={vi.fn()}
      />,
      { tenant: zwoelfTenant }
    );

    expect(
      screen.getByRole('radio', { name: t('subscribe.goodie.none') })
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Tasse/ })).toBeInTheDocument();
  });

  it('renders nothing without goodies', () => {
    const onChange = vi.fn();
    const { container } = renderWithProviders(
      <ZwoelfGoodiePicker
        goodies={[]}
        value={null}
        onChange={onChange}
      />,
      { tenant: zwoelfTenant }
    );

    expect(container).toBeEmptyDOMElement();
    expect(onChange).not.toHaveBeenCalled();
  });
});
