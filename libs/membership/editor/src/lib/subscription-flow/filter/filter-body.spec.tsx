import { render, screen } from '@testing-library/react';
import type { FullMemberPlanFragment } from '@wepublish/editor/api';

import { FilterBody } from './filter-body';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const memberPlan = { id: 'plan' } as FullMemberPlanFragment;

describe('FilterBody', () => {
  it('stretches the create button across the remaining columns', () => {
    render(
      <table>
        <tbody>
          <tr>
            <FilterBody
              memberPlan={memberPlan}
              createNewFlow
              paymentMethods={undefined}
              actionColSpan={7}
            />
          </tr>
        </tbody>
      </table>
    );

    const cell = screen
      .getByRole('button', { name: /subscriptionFlow.addNew/ })
      .closest('td');

    expect(cell?.colSpan).toBe(7);
  });
});
