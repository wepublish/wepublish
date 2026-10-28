import { screen } from '@testing-library/react';
import {
  mockBreakBlock,
  mockCustomTeaser,
  mockTeaserGridBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { FullBlockFragment } from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';

import { staticImageSrc } from './assets/static-image';
import { bajourTenant } from './bajour-tenant';
import BaselBg from './components/briefing/basel.jpg';
import { BriefingType } from './components/briefing/is-briefing';

const TenantPage = ({ blocks }: { blocks: FullBlockFragment[] }) => {
  const {
    elements: { Button },
    blocks: { Blocks },
  } = useWebsiteBuilder();

  return (
    <>
      <Button variant="contained">Primary</Button>

      <Blocks
        blocks={blocks}
        type="Page"
      />
    </>
  );
};

const renderTenantPage = (blocks: FullBlockFragment[] = []) =>
  renderWithProviders(<TenantPage blocks={blocks} />, {
    tenant: bajourTenant,
  });

const theme = bajourTenant.createTheme();

const backgroundsOf = (element: HTMLElement | null): string[] =>
  element ?
    [
      getComputedStyle(element).backgroundColor,
      ...backgroundsOf(element.parentElement),
    ]
  : [];

const briefingTeaser = mockCustomTeaser({
  title: 'Guten Morgen, Basel',
  lead: 'Anna Muster',
});

const baselBriefing = mockTeaserGridBlock({
  blockStyle: BriefingType.BaselBriefing,
  numColumns: 1,
  teasers: [briefingTeaser],
});

describe('bajour tenant', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('sets buttons in Roboto on the bajour primary colour', () => {
    renderTenantPage();

    const button = screen.getByRole('button', { name: 'Primary' });

    expect(getComputedStyle(button).fontFamily).toContain('Roboto');
    expect(getComputedStyle(button).backgroundColor).toBe(
      theme.palette.primary.main
    );
  });

  it('shows the basel briefing in the morning on the basel background', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2024, 4, 6, 8, 0));

    const { container } = renderTenantPage([baselBriefing]);

    expect(screen.getByText('Basel Briefing')).toBeInTheDocument();
    expect(screen.getByText('Guten Morgen, Basel')).toBeInTheDocument();
    expect(
      screen.getByText('Anna Muster', { exact: false })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /lesen/ })).toHaveAttribute(
      'href',
      briefingTeaser.contentUrl
    );
    expect(
      container.querySelector(`img[srcset*="${staticImageSrc(BaselBg)}"]`)
    ).toBeInTheDocument();
  });

  it('hides the basel briefing outside of its timeslot', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2024, 4, 6, 14, 0));

    renderTenantPage([baselBriefing]);

    expect(screen.queryByText('Basel Briefing')).not.toBeInTheDocument();
    expect(screen.queryByText('Guten Morgen, Basel')).not.toBeInTheDocument();
  });

  it('shows the briefing during the timeslot given in the teaser properties', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2024, 4, 6, 14, 0));

    renderTenantPage([
      mockTeaserGridBlock({
        blockStyle: BriefingType.BaselBriefing,
        numColumns: 1,
        teasers: [
          mockCustomTeaser({
            title: 'Guten Tag, Basel',
            lead: 'Anna Muster',
            properties: [
              { __typename: 'Property', key: 'showFrom', value: '13:00' },
              { __typename: 'Property', key: 'showUntil', value: '15:00' },
            ],
          }),
        ],
      }),
    ]);

    expect(screen.getByText('Guten Tag, Basel')).toBeInTheDocument();
  });

  it('paints light break blocks in the secondary colour', () => {
    renderTenantPage([
      mockBreakBlock({ blockStyle: 'Light', text: 'Bajour braucht dich' }),
      mockBreakBlock({ text: 'Werde Member' }),
    ]);

    expect(backgroundsOf(screen.getByText('Bajour braucht dich'))).toContain(
      theme.palette.secondary.main
    );
    expect(backgroundsOf(screen.getByText('Werde Member'))).toContain(
      theme.palette.accent.main
    );
  });
});
