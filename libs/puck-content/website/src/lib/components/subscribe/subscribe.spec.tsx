import { screen, within } from '@testing-library/react';
import { mockMemberPlan, renderWithProviders } from '@wepublish/mocks/website';
import type { BuilderSubscribeBlockProps } from '@wepublish/website/builder';
import { PropsWithChildren } from 'react';

import { emptyPuckBlockData, PuckBlockData } from '../../blocks/block.types';
import { FormContext } from '../form/form/form.context';
import { SubscribeConfigProps, SubscribeRender } from './subscribe.component';

const receivedProps = vi.hoisted(() => [] as unknown[]);

vi.mock('@wepublish/block-content/website', async importOriginal => ({
  ...(await importOriginal<
    typeof import('@wepublish/block-content/website')
  >()),
  SubscribeBlockProvider: ({ children }: PropsWithChildren) => children,
}));

vi.mock('@wepublish/website/builder', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/website/builder')>()),
  SubscribeBlock: (props: BuilderSubscribeBlockProps) => {
    receivedProps.push(props);

    return (
      <ul
        aria-label="Offered plans"
        className={props.className}
      >
        {props.memberPlans.map(plan => (
          <li key={plan.id}>{plan.name}</li>
        ))}
      </ul>
    );
  },
}));

const yearly = mockMemberPlan({ id: 'yearly', name: 'Yearly' });
const student = mockMemberPlan({ id: 'student', name: 'Student' });

const subscribeProps: SubscribeConfigProps = {
  fields: [],
  showGoodies: false,
  showDiscountCodes: false,
  goodieMinValueAppliesToUpgrade: false,
  hideRepeatGoodieOnUpgrade: false,
};

const subscribe = (data: PuckBlockData = emptyPuckBlockData) => (
  <SubscribeRender
    id="Subscribe-1"
    props={subscribeProps}
    data={data}
    slots={{}}
    className="styled"
  />
);

const offeredPlans = () =>
  within(screen.getByRole('list', { name: 'Offered plans' }))
    .queryAllByRole('listitem')
    .map(item => item.textContent);

beforeEach(() => {
  receivedProps.length = 0;
});

describe('SubscribeRender', () => {
  it('offers the member plans of its data in their order', () => {
    renderWithProviders(
      subscribe({ ...emptyPuckBlockData, memberPlans: [student, yearly] })
    );

    expect(offeredPlans()).toEqual(['Student', 'Yearly']);
  });

  it('offers no member plans while its data has none', () => {
    renderWithProviders(subscribe());

    expect(offeredPlans()).toEqual([]);
  });

  it('renders one root element that carries the class name', () => {
    const { container } = renderWithProviders(subscribe());

    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild?.classList).toContain('styled');
  });

  it('passes the stored props on and nothing of the envelope', () => {
    renderWithProviders(
      subscribe({ ...emptyPuckBlockData, memberPlans: [yearly] })
    );

    expect(receivedProps.at(-1)).toEqual({
      ...subscribeProps,
      className: 'styled',
      memberPlans: [yearly],
      memberPlanIds: ['yearly'],
      memberPlanRenderSettings: [],
    });
  });

  it('renders nothing inside a Form', () => {
    const { container } = renderWithProviders(
      <FormContext.Provider value={{ id: 'Form-1' }}>
        {subscribe({ ...emptyPuckBlockData, memberPlans: [yearly] })}
      </FormContext.Provider>
    );

    expect(container.textContent).toBe('');
    expect(screen.queryByRole('list', { name: 'Offered plans' })).toBeNull();
  });
});
