import { screen } from '@testing-library/react';
import {
  applyTenantTranslations,
  mockEvent,
  mockImage,
  renderWithProviders,
  resetTranslations,
} from '@wepublish/mocks/website';
import { FullEventFragment } from '@wepublish/website/api';

import { wepublishSiteTenant } from '../../wepublish-site-tenant';
import { WepEvent } from './wep-event';

const event = (overrides: Partial<FullEventFragment> = {}) =>
  mockEvent({
    name: 'Wie framet KI die Informationsbeschaffung?',
    lead: 'Ein Austausch über KI-Übersichten.',
    location: 'Schöngrün, Bern',
    startsAt: new Date(2026, 5, 16, 17, 40).toISOString(),
    endsAt: new Date(2026, 5, 16, 18, 0).toISOString(),
    image: mockImage({ title: 'Gemini und ChatGPT' }),
    description: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'KI verändert, wie sich Menschen informieren.',
            },
          ],
        },
      ],
    } as FullEventFragment['description'],
    ...overrides,
  });

const renderEvent = (overrides?: Partial<FullEventFragment>) =>
  renderWithProviders(
    <WepEvent
      data={{ event: event(overrides) }}
      loading={false}
      error={undefined}
    />,
    { tenant: wepublishSiteTenant, router: { locale: 'de' } }
  );

describe('event page', () => {
  beforeAll(() => applyTenantTranslations(wepublishSiteTenant));
  afterAll(() => resetTranslations());

  it('opens with "Event" above the name of the event', () => {
    renderEvent();

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Wie framet KI die Informationsbeschaffung?',
      })
    ).toBeInTheDocument();
    expect(screen.getByText('Event')).toBeInTheDocument();
  });

  it('shows date, place and lead below the name', () => {
    renderEvent();

    expect(
      screen.getByText('Dienstag, 16. Juni 2026, 17.40–18 Uhr')
    ).toBeInTheDocument();
    expect(screen.getByText('Schöngrün, Bern')).toBeInTheDocument();
    expect(
      screen.getByText('Ein Austausch über KI-Übersichten.')
    ).toBeInTheDocument();
  });

  it('leaves out the place when it is not known yet', () => {
    renderEvent({ location: null });

    expect(screen.queryByText('Schöngrün, Bern')).not.toBeInTheDocument();
  });

  it('offers to save the event in a calendar', () => {
    renderEvent();

    expect(
      screen.getByRole('button', { name: 'Im Kalender speichern (.ics)' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Zu Google Kalender hinzufügen' })
    ).toHaveAttribute(
      'href',
      expect.stringContaining('https://calendar.google.com/calendar/render')
    );
  });

  it('shows the image and the description', () => {
    renderEvent();

    expect(
      screen.getByRole('img', { name: 'Gemini und ChatGPT' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('KI verändert, wie sich Menschen informieren.')
    ).toBeInTheDocument();
  });
});
