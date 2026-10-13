import { GateActionRole, GateMode, LoginStatus } from '@prisma/client';
import { ContentGateAudience } from './content-gate.model';
import { toContentGate } from './to-content-gate';

const gate = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'gate-1',
    createdAt: new Date('2026-01-01'),
    modifiedAt: new Date('2026-01-02'),
    mode: GateMode.CONTENT_GATE,
    name: 'Wall',
    active: true,
    audience: LoginStatus.LOGGED_OUT,
    freeArticles: 3,
    softGateArticles: 2,
    previewBlocks: 4,
    meterWindowDays: 30,
    softDescription: [{ type: 'soft' }],
    description: [{ type: 'hard' }],
    newsletterParams: [{ key: 'utm_medium', value: 'email' }],
    newsletterNeverGate: true,
    newsletterFreeArticles: 1,
    actions: [],
    ...overrides,
  }) as any;

describe('toContentGate', () => {
  it('maps a content gate onto the content gate the website knows', () => {
    expect(toContentGate(gate())).toEqual({
      id: 'gate-1',
      createdAt: new Date('2026-01-01'),
      modifiedAt: new Date('2026-01-02'),
      name: 'Wall',
      active: true,
      audience: ContentGateAudience.ANONYMOUS,
      freeArticles: 3,
      softGateArticles: 2,
      previewBlocks: 4,
      meterWindowDays: 30,
      softDescription: [{ type: 'soft' }],
      hardDescription: [{ type: 'hard' }],
      ctaLabel: undefined,
      ctaUrl: undefined,
      newsletterParams: [{ key: 'utm_medium', value: 'email' }],
      newsletterNeverGate: true,
      newsletterFreeArticles: 1,
    });
  });

  it.each([
    [LoginStatus.LOGGED_OUT, ContentGateAudience.ANONYMOUS],
    [LoginStatus.UNSUBSCRIBED, ContentGateAudience.NON_SUBSCRIBERS],
  ])('answers the audience %s as %s', (audience, expected) => {
    expect(toContentGate(gate({ audience }))?.audience).toBe(expected);
  });

  it('takes the CTA from the primary action', () => {
    expect(
      toContentGate(
        gate({
          actions: [
            { role: GateActionRole.PRIMARY, label: 'Sign up', url: '/signup' },
          ],
        })
      )
    ).toMatchObject({ ctaLabel: 'Sign up', ctaUrl: '/signup' });
  });

  it('is no content gate when the gate is not one', () => {
    expect(toContentGate(gate({ mode: GateMode.PAYWALL }))).toBeNull();
    expect(toContentGate(null)).toBeNull();
  });
});
