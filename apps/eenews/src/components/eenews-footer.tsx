import styled from '@emotion/styled';
import { Box, Container, Typography } from '@mui/material';
import { BuilderFooterProps } from '@wepublish/website/builder';
import Link from 'next/link';

import { eenewsColors } from '../theme';

const FooterShell = styled('footer')`
  background: ${eenewsColors.ink};
  color: ${eenewsColors.paper};
  margin-top: 80px;
`;

const FooterInner = styled('div')`
  padding: 72px 0 32px;
  @media (max-width: 800px) {
    padding: 48px 0 24px;
  }
`;

const FooterGrid = styled('div')`
  display: grid;
  grid-template-columns: 1.6fr repeat(3, 1fr);
  gap: 56px;
  padding-bottom: 56px;
  border-bottom: 1px solid rgba(245, 240, 230, 0.15);
  @media (max-width: 1100px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (max-width: 800px) {
    grid-template-columns: 1fr;
    gap: 32px;
    padding-bottom: 32px;
  }
`;

const BrandColumn = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const BrandWordmark = styled('div')`
  font-size: 36px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.02em;
`;

const BrandAccent = styled('span')`
  color: ${eenewsColors.accent};
`;

const BrandDescription = styled('p')`
  font-size: 16px;
  line-height: 1.5;
  color: rgba(245, 240, 230, 0.7);
  max-width: 380px;
  margin: 0;
`;

const SocialRow = styled('div')`
  display: flex;
  gap: 12px;
  margin-top: 8px;
  flex-wrap: wrap;
`;

const SocialPill = styled(Link)`
  padding: 6px 12px;
  border: 1px solid rgba(245, 240, 230, 0.3);
  border-radius: 999px;
  font-size: 12px;
  color: ${eenewsColors.paper};
  text-decoration: none;
  &:hover {
    background: rgba(245, 240, 230, 0.08);
  }
`;

const ColumnHeading = styled('h4')`
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${eenewsColors.accent};
  margin: 0 0 14px;
  font-weight: 400;
`;

const ColumnLink = styled(Link)`
  display: block;
  padding: 6px 0;
  text-decoration: none;
  color: ${eenewsColors.paper};
  font-size: 15px;
  line-height: 1.4;
  &:hover {
    color: ${eenewsColors.accent};
  }
`;

const BottomRow = styled('div')`
  display: flex;
  justify-content: space-between;
  padding-top: 24px;
  font-size: 11px;
  color: rgba(245, 240, 230, 0.6);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  @media (max-width: 800px) {
    flex-direction: column;
    gap: 8px;
  }
`;

type FooterColumn = {
  title: string;
  items: Array<{ label: string; href: string }>;
};

const FALLBACK_COLUMNS: FooterColumn[] = [
  {
    title: 'Themen',
    items: [
      { label: 'Solar', href: '/a/tag/solar' },
      { label: 'Wind', href: '/a/tag/wind' },
      { label: 'Wasser', href: '/a/tag/wasser' },
      { label: 'Mobilität', href: '/a/tag/mobilitaet' },
      { label: 'Speicher', href: '/a/tag/speicher' },
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
];

/**
 * EE News footer — v2 design.
 *
 * Ink bg + paper text. 4-col grid (1.6fr + 3 × 1fr): brand+description+social
 * pills + Themen / Magazin / ee·news. Bottom row: copyright + tagline.
 *
 * Columns are sourced from the wepublish "footer" navigation if available;
 * otherwise the fallback structure renders so the footer is never empty.
 */
export const EenewsFooter = (props: BuilderFooterProps) => {
  const data = (props as any).data;
  const footerNav = data?.navigations?.find?.(
    (n: { key: string }) => n.key === 'footer'
  );

  // If the CMS exposes a footer navigation, use it; otherwise render fallbacks.
  const columns: FooterColumn[] =
    footerNav?.links?.length ?
      FALLBACK_COLUMNS.map((fallback, i) => ({
        title: fallback.title,
        items: footerNav.links
          .filter((l: any) => l.column === i + 1 || !l.column)
          .map((l: any) => ({ label: l.label, href: l.url ?? '#' })),
      }))
    : FALLBACK_COLUMNS;

  return (
    <FooterShell className={props.className}>
      <Container>
        <FooterInner>
          <FooterGrid>
            <BrandColumn>
              <BrandWordmark>
                ee<BrandAccent>·</BrandAccent>news
              </BrandWordmark>
              <BrandDescription>
                Unabhängiger Journalismus zu erneuerbaren Energien, Effizienz
                und der Energiewende — mit Fokus Schweiz, Blick auf die Welt.
              </BrandDescription>
              <SocialRow>
                {['Twitter', 'LinkedIn', 'RSS', 'Mastodon'].map(s => (
                  <SocialPill
                    key={s}
                    href="#"
                    onClick={e => e.preventDefault()}
                  >
                    {s}
                  </SocialPill>
                ))}
              </SocialRow>
            </BrandColumn>
            {columns.map(column => (
              <Box key={column.title}>
                <ColumnHeading>{column.title}</ColumnHeading>
                {column.items.map(item => (
                  <ColumnLink
                    key={item.label}
                    href={item.href}
                  >
                    {item.label}
                  </ColumnLink>
                ))}
              </Box>
            ))}
          </FooterGrid>
          <BottomRow>
            <Typography
              variant="metaEyebrowSmall"
              component="span"
              sx={{ color: 'inherit' }}
            >
              © {new Date().getFullYear()} ee·news — Erneuerbare Energien
              Schweiz
            </Typography>
            <Typography
              variant="metaEyebrowSmall"
              component="span"
              sx={{ color: 'inherit' }}
            >
              Made in Switzerland
            </Typography>
          </BottomRow>
        </FooterInner>
      </Container>
    </FooterShell>
  );
};
