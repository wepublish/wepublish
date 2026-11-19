import { screen, within } from '@testing-library/react';
import {
  applyTenantTranslations,
  mockEvent,
  mockImage,
  renderWithProviders,
  resetTranslations,
} from '@wepublish/mocks/website';

import { wepublishSiteTenant } from '../../wepublish-site-tenant';
import { WepEventOverview } from './event-overview';

const now = new Date('2026-10-01T12:00:00');

const event = (name: string, startsAt: string, endsAt?: string) =>
  mockEvent({
    name,
    startsAt: new Date(startsAt).toISOString(),
    endsAt: endsAt ? new Date(endsAt).toISOString() : null,
    location: 'Schöngrün, Bern',
    url: `https://wepublish.ch/event/${name}`,
    image: mockImage({ title: `Bild ${name}` }),
  });

const pastEvents = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    event(
      `Workshop ${index + 1}`,
      `2026-06-${String(index + 1).padStart(2, '0')}T17:40:00`,
      `2026-06-${String(index + 1).padStart(2, '0')}T18:00:00`
    )
  );

const renderOverview = ({
  events = [
    event('Camp', '2026-10-17T00:00:00', '2026-10-19T00:00:00'),
    event('Austausch', '2026-10-05T14:00:00', '2026-10-05T16:00:00'),
    ...pastEvents(3),
  ],
  page,
}: { events?: ReturnType<typeof event>[]; page?: number } = {}) =>
  renderWithProviders(
    <WepEventOverview
      events={events}
      now={now}
      page={page}
      onPageChange={() => undefined}
    />,
    { tenant: wepublishSiteTenant, router: { locale: 'de' } }
  );

const upcomingList = () =>
  screen.getByRole('region', { name: 'Kommende Events' });

const pastList = () =>
  screen.getByRole('region', { name: 'Vergangene Events' });

describe('event overview', () => {
  beforeAll(() => applyTenantTranslations(wepublishSiteTenant));
  afterAll(() => resetTranslations());

  it('opens with the pre-title, the title and the lead', () => {
    renderOverview();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Events' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Aus dem We.Publish Ökosystem')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Wir organisieren regelmässig Austauschformate, Camps und Workshops für Medienschaffende und alle, die unabhängigen Journalismus mitgestalten wollen.'
      )
    ).toBeInTheDocument();
  });

  it('leaves room above the footer', () => {
    renderOverview();

    // 180px to the footer in the design, 24px of them are below the page already
    const page = upcomingList().parentElement as HTMLElement;

    expect(getComputedStyle(page).paddingBottom).toBe('96px');
  });

  it('lists the coming events first, the next one on top', () => {
    renderOverview();

    expect(
      within(upcomingList())
        .getAllByRole('article')
        .map(article => within(article).getByRole('heading').textContent)
    ).toEqual(['Austausch', 'Camp']);
  });

  it('shows image, date and place of a coming event and links it', () => {
    renderOverview();

    const camp = within(upcomingList()).getByRole('article', { name: 'Camp' });

    expect(
      within(camp).getByRole('img', { name: 'Bild Camp' })
    ).toBeInTheDocument();
    expect(within(camp).getByText('17.–19. Oktober 2026')).toBeInTheDocument();
    expect(within(camp).getByText('Schöngrün, Bern')).toBeInTheDocument();
    expect(within(camp).getByRole('link')).toHaveAttribute(
      'href',
      'https://wepublish.ch/event/Camp'
    );
  });

  it('counts an event that is still running as coming', () => {
    renderOverview({
      events: [event('Läuft', '2026-09-30T09:00:00', '2026-10-02T17:00:00')],
    });

    expect(
      within(upcomingList()).getByRole('article', { name: 'Läuft' })
    ).toBeInTheDocument();
  });

  it('lists the past events without image, the latest on top', () => {
    renderOverview();

    const past = within(pastList()).getAllByRole('article');

    expect(
      past.map(article => within(article).getByRole('heading').textContent)
    ).toEqual(['Workshop 3', 'Workshop 2', 'Workshop 1']);
    expect(within(pastList()).queryByRole('img')).not.toBeInTheDocument();
    expect(
      within(past[0]).getByText('Mittwoch, 3. Juni 2026, 17.40–18 Uhr')
    ).toBeInTheDocument();
  });

  it('shows ten past events per page', () => {
    renderOverview({ events: pastEvents(12), page: 2 });

    expect(
      within(pastList())
        .getAllByRole('article')
        .map(article => within(article).getByRole('heading').textContent)
    ).toEqual(['Workshop 2', 'Workshop 1']);
    expect(
      screen.getByRole('navigation', { name: /pagination/i })
    ).toBeInTheDocument();
  });

  it('says so when no event is planned', () => {
    renderOverview({ events: pastEvents(1) });

    expect(
      within(upcomingList()).getByText('Zurzeit sind keine Events geplant.')
    ).toBeInTheDocument();
  });

  it('leaves out the past events when there are none', () => {
    renderOverview({
      events: [event('Camp', '2026-10-17T00:00:00', '2026-10-19T00:00:00')],
    });

    expect(
      screen.queryByRole('region', { name: 'Vergangene Events' })
    ).not.toBeInTheDocument();
  });
});
