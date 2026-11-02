import { fireEvent, screen, within } from '@testing-library/react';
import {
  applyTenantTranslations,
  mockMemberPlan,
  renderWithProviders,
  resetTranslations,
} from '@wepublish/mocks/website';

import { zwoelfTenant } from '../zwoelf-tenant';
import { ZwoelfMemberPlanPicker } from './zwoelf-memberplan-picker';

const basic = mockMemberPlan({ name: 'Basic', tags: [] });
const fankurve = mockMemberPlan({
  name: '#12 - Fankurve',
  tags: ['supporter'],
});
const haupttribuene = mockMemberPlan({
  name: '#12 - Haupttribüne',
  tags: ['supporter'],
});

describe('ZwoelfMemberPlanPicker', () => {
  beforeAll(() => applyTenantTranslations(zwoelfTenant));
  afterAll(() => resetTranslations());

  it('groups the supporter plans under their own title and description', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <ZwoelfMemberPlanPicker
        memberPlans={[basic, fankurve, haupttribuene]}
        value={basic.id}
        onChange={onChange}
      />,
      { tenant: zwoelfTenant }
    );

    const group = screen.getByRole('group', { name: 'Supporter-Abos' });

    expect(group).toHaveTextContent(
      'Alle drei Supporter-Abos enthalten den Zugriff auf das Archiv (PDF)'
    );
    expect(
      within(group).getByLabelText('#12 - Fankurve', { exact: false })
    ).toBeInTheDocument();
    expect(
      within(group).queryByLabelText('Basic', { exact: false })
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('Basic', { exact: false })).toBeChecked();

    fireEvent.click(
      within(group).getByLabelText('#12 - Haupttribüne', { exact: false })
    );

    expect(onChange).toHaveBeenCalledWith(haupttribuene.id);
  });

  it('does not render the group without supporter plans', () => {
    renderWithProviders(
      <ZwoelfMemberPlanPicker
        memberPlans={[basic]}
        value={basic.id}
        onChange={vi.fn()}
      />,
      { tenant: zwoelfTenant }
    );

    expect(
      screen.queryByRole('group', { name: 'Supporter-Abos' })
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('Basic', { exact: false })).toBeChecked();
  });

  it('selects the first plan when none is chosen yet', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <ZwoelfMemberPlanPicker
        memberPlans={[basic, fankurve]}
        onChange={onChange}
      />,
      { tenant: zwoelfTenant }
    );

    expect(onChange).toHaveBeenCalledWith(basic.id);
  });
});
