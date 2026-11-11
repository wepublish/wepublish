import { renderHook } from '@testing-library/react';

import { useAudienceLookups } from './use-audience-lookups';

const queries = vi.fn();

const operationName = (document: unknown) =>
  (document as { definitions?: { name?: { value?: string } }[] })
    ?.definitions?.[0]?.name?.value;

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: (document: unknown, options?: unknown) =>
    queries(operationName(document), options),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'de-CH' },
  }),
}));

describe('useAudienceLookups', () => {
  beforeEach(() => {
    queries.mockImplementation((name: string) => {
      switch (name) {
        case 'MemberPlanList':
          return {
            data: { memberPlans: { nodes: [{ id: 'p1', name: 'Jahresabo' }] } },
          };
        case 'PaymentMethodList':
          return {
            data: { paymentMethods: [{ id: 'pm1', name: 'Rechnung' }] },
          };
        case 'MailTemplate':
          return { data: { mailTemplates: [{ id: 't1', name: 'Mahnung' }] } };
        default:
          return {};
      }
    });
  });

  it('names plans, payment methods and templates for the audience phrases', () => {
    const { result } = renderHook(() => useAudienceLookups());

    expect(result.current.memberPlans.get('p1')).toBe('Jahresabo');
    expect(result.current.paymentMethods.get('pm1')).toBe('Rechnung');
    expect(result.current.templates.get('t1')).toBe('Mahnung');
    expect(result.current.t('x')).toBe('x');
    expect(result.current.formatDate('2026-10-12T08:00:00.000Z')).toMatch(
      /2026/
    );
  });

  it('asks for every plan at once', () => {
    renderHook(() => useAudienceLookups());

    expect(
      queries.mock.calls.find(([name]) => name === 'MemberPlanList')?.[1]
    ).toEqual(expect.objectContaining({ variables: { take: 100 } }));
  });
});
