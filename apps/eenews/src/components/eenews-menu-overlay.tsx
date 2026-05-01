import styled from '@emotion/styled';
import { Box, Container, Typography } from '@mui/material';
import { BuilderNavbarProps } from '@wepublish/website/builder';
import Link from 'next/link';

import { eenewsColors } from '../theme';

const Backdrop = styled('div')<{ open: boolean }>`
  position: fixed;
  inset: 0;
  z-index: 70;
  background: rgba(14, 42, 59, 0.4);
  backdrop-filter: blur(2px);
  opacity: ${({ open }) => (open ? 1 : 0)};
  pointer-events: ${({ open }) => (open ? 'auto' : 'none')};
  transition: opacity 0.3s ease;
`;

const Drawer = styled('div')<{ open: boolean }>`
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  z-index: 71;
  background: ${eenewsColors.paper};
  box-shadow: 0 24px 60px rgba(14, 42, 59, 0.18);
  transform: ${({ open }) => (open ? 'translateY(0)' : 'translateY(-100%)')};
  transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
  pointer-events: ${({ open }) => (open ? 'auto' : 'none')};
  border-bottom: 1px solid ${eenewsColors.rule};
`;

const DrawerInner = styled('div')`
  /* Top padding clears the topbar (~158px tall: utility row + main bar +
     bottom nav strip) so the H2 sits cleanly below it. The drawer slides
     under the elevated topbar (z: 80 when menu is open) — the navbar's
     own pill button serves as the close button. */
  padding: 160px 0 80px;
  display: grid;
  grid-template-columns: 1.4fr repeat(4, 1fr);
  gap: 48px;
  @media (max-width: 1100px) {
    grid-template-columns: 1.4fr repeat(2, 1fr);
    gap: 32px;
  }
  @media (max-width: 700px) {
    grid-template-columns: 1fr;
    padding: 110px 0 48px;
    gap: 24px;
  }
`;

const BrandColumn = styled('div', {
  shouldForwardProp: prop => prop !== 'open',
})<{ open: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 32px;
  /* H2 fade-in starts mid-slide (small delay) and lingers across most of the
     drawer's settling motion — feels softer than waiting for the slide to
     finish. Fade-out is instant so the H2 vanishes the moment the user
     clicks Schliessen, leaving the slide-up uncontested. */
  opacity: ${({ open }) => (open ? 1 : 0)};
  transition: opacity 500ms ease;
  transition-delay: ${({ open }) => (open ? '180ms' : '0ms')};
`;

// Note: there is intentionally no CloseButton here. The navbar's "Themen"
// PillButton already swaps to "Schliessen" + X icon when `menuOpen` is true.
// We bump TopbarShell's z-index above this drawer (z: 71) when the menu is
// open so the same pill stays clickable on top of the drawer paper — the
// user toggles the menu by clicking the same button at the same X/Y.

const GroupColumn = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const GroupHeading = styled('div')`
  padding-bottom: 8px;
  border-bottom: 1px solid ${eenewsColors.rule};
  color: ${eenewsColors.inkSoft};
`;

const GroupLink = styled(Link, {
  shouldForwardProp: prop => prop !== 'secondary',
})<{ secondary?: boolean }>`
  display: block;
  padding: 6px 0;
  text-decoration: none;
  color: ${({ secondary }) =>
    secondary ? eenewsColors.inkSoft : eenewsColors.ink};
  font-weight: ${({ secondary }) => (secondary ? 400 : 500)};
  font-size: ${({ secondary }) => (secondary ? '14px' : '18px')};
  line-height: 1.3;
  &:hover {
    color: ${eenewsColors.ink};
  }
`;

type Props = {
  open: boolean;
  onClose: () => void;
  navbarProps: BuilderNavbarProps;
};

/**
 * Menu overlay — v2 design (top drawer, paper bg).
 *
 * Three primary groups (Themen / Magazin / ee·news) + brand column with close button.
 * Groups draw from the wepublish `main` navigation (and optional category slugs).
 *
 * The wepublish `BuilderNavbarProps` exposes `data` with `navigations` —
 * we render the navigation matching `slug` ("main") as the primary group, and
 * fall back to a hardcoded structure if data isn't available yet (e.g. CMS empty).
 */
type GroupItem = { label: string; href: string; secondary?: boolean };
type Group = { title: string; items: GroupItem[] };

/** Split a long item list into N equal-ish chunks. Keeps order. */
const chunkItems = <T,>(items: T[], chunks: number): T[][] => {
  if (items.length === 0 || chunks <= 1) {
    return [items];
  }
  const perChunk = Math.ceil(items.length / chunks);
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += perChunk) {
    out.push(items.slice(i, i + perChunk));
  }
  return out;
};

export const EenewsMenuOverlay = ({ open, onClose, navbarProps }: Props) => {
  const data = (navbarProps as any).data; // BuilderNavbarProps.data is loosely typed
  const allNavigations: Array<{
    key: string;
    name?: string | null;
    links: Array<{ label: string; url?: string | null }>;
  }> = data?.navigations ?? [];

  // Each menu column is its own Navigation in the CMS, prefixed `menu-`.
  // Sort by key so `menu-1-themen`, `menu-2-magazin` etc render in order.
  // The Navigation `name` becomes the column heading; whitespace `name`
  // suppresses the heading (overlay renders a 30px spacer instead).
  const menuNavs = allNavigations
    .filter(n => n.key?.startsWith('menu-'))
    .sort((a, b) => a.key.localeCompare(b.key));

  // Last menu navigation gets the secondary styling (smaller font,
  // ink-soft colour) — matches the v2 design tail group.
  const secondaryKey = menuNavs[menuNavs.length - 1]?.key;

  const cmsGrouped: Group[] = menuNavs.map(n => ({
    title: n.name ?? '',
    items: (n.links ?? []).map(l => ({
      label: l.label,
      href: l.url ?? '#',
      secondary: n.key === secondaryKey,
    })),
  }));

  const main = allNavigations.find(n => n.key === 'main');
  const cmsFlatLinks: GroupItem[] = (main?.links ?? []).map(l => ({
    label: l.label,
    href: l.url ?? '#',
  }));

  // Build display groups. The grid has 4 group columns next to the brand
  // column, so we normalise to up to 4 visible groups in priority order:
  //   1. CMS-grouped (`menu-*` navigations)  : one column per nav.
  //   2. CMS-flat fallback (single `main`)   : chunk into 4.
  //   3. CMS empty                            : hardcoded 4-group fallback.
  const groups: Group[] =
    cmsGrouped.length ? cmsGrouped
    : cmsFlatLinks.length ?
      chunkItems(cmsFlatLinks, 4).map((items, i) => ({
        // Only the first chunk carries the heading; subsequent chunks render
        // as untitled spillover columns (matches v2 where MENU_GROUPS uses
        // ` ` for non-first headings to keep alignment).
        title: i === 0 ? 'Themen' : ' ',
        items,
      }))
    : [
        {
          title: 'Themen',
          items: [
            { label: 'Solar', href: '/a/tag/solar' },
            { label: 'Wind', href: '/a/tag/wind' },
            { label: 'Wasser', href: '/a/tag/wasser' },
            { label: 'Mobilität', href: '/a/tag/mobilität' },
            { label: 'Speicher', href: '/a/tag/speicher' },
            { label: 'Bauen', href: '/a/tag/bauen' },
          ],
        },
        {
          title: 'Magazin',
          items: [
            { label: 'Autor·innen', href: '/author' },
            { label: 'Veranstaltungen', href: '/event' },
            { label: 'Archiv', href: '/a' },
            { label: 'Mitmachen', href: '/mitmachen' },
            { label: 'Newsletter', href: '/newsletter' },
          ],
        },
        {
          title: 'ee·news',
          items: [
            { label: 'Profil', href: '/profile' },
            { label: 'Impressum', href: '/impressum' },
            { label: 'Datenschutz', href: '/impressum#privacy' },
            { label: 'Kontakt', href: '/impressum#contact' },
          ],
        },
        {
          title: ' ',
          items: [
            {
              label: 'Newsletter bestellen',
              href: '/newsletter',
              secondary: true,
            },
            { label: 'Inserate', href: '/impressum#inserate', secondary: true },
            { label: 'Unterstützen', href: '/mitmachen', secondary: true },
            {
              label: 'Datenschutz',
              href: '/impressum#privacy',
              secondary: true,
            },
          ],
        },
      ];

  return (
    <>
      <Backdrop
        open={open}
        onClick={onClose}
        aria-hidden
      />
      <Drawer
        open={open}
        role="dialog"
        aria-modal="true"
        aria-label="Hauptmenü"
      >
        <Container>
          <DrawerInner>
            <BrandColumn open={open}>
              <Typography
                variant="displayMenuOverlay"
                component="h2"
                sx={{ margin: 0, color: eenewsColors.ink }}
              >
                Erneuerbare Energien, Effizienz und Klima — kuratiert.
              </Typography>
            </BrandColumn>
            {groups.map((group, gi) => (
              <GroupColumn key={`${group.title}-${gi}`}>
                {
                  group.title.trim() ?
                    <GroupHeading>
                      <Typography
                        variant="metaEyebrow"
                        component="div"
                      >
                        {group.title}
                      </Typography>
                    </GroupHeading>
                    // Spacer keeps the items aligned across columns when this
                    // column has no heading (typical for chunked spillover).
                  : <Box
                      sx={{ height: 30 }}
                      aria-hidden
                    />

                }
                <Box>
                  {group.items.map(item => (
                    <GroupLink
                      key={item.label}
                      href={item.href}
                      secondary={item.secondary}
                      onClick={onClose}
                    >
                      {item.label}
                    </GroupLink>
                  ))}
                </Box>
              </GroupColumn>
            ))}
          </DrawerInner>
        </Container>
      </Drawer>
    </>
  );
};
