import styled from '@emotion/styled';
import { Typography, useTheme } from '@mui/material';
import {
  FullNavigationFragment,
  NavigationListQuery,
} from '@wepublish/website/api';
import { BuilderFooterProps, Link } from '@wepublish/website/builder';

const navigationLinkToUrl = (
  link: FullNavigationFragment['links'][number]
): string | undefined => {
  switch (link.__typename) {
    case 'ArticleNavigationLink':
      return link.article?.url;
    case 'PageNavigationLink':
      return link.page?.url;
    case 'ExternalNavigationLink':
      return link.url ?? undefined;
  }
};

const findNavBySlug = (
  data: NavigationListQuery | undefined,
  key: string
): FullNavigationFragment | undefined =>
  data?.navigations?.find(n => n.key === key) ?? undefined;

const Wrapper = styled('footer')`
  background: ${({ theme }) => theme.palette.primary.main};
  color: #d8ecf6;
  padding: 56px 56px 24px;
  margin-top: auto;
  ${({ theme }) => theme.breakpoints.down('md')} {
    padding: 36px 20px 20px;
  }
`;

const Inner = styled('div')`
  max-width: calc(var(--max-width) + var(--skycraper-width));
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1.2fr;
  gap: 48px;
  padding-bottom: 40px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.18);

  ${({ theme }) => theme.breakpoints.down('md')} {
    grid-template-columns: 1fr;
    gap: 28px;
  }
`;

const Col = styled('div')``;

const Heading = styled(Typography)`
  display: block;
  margin: 0 0 14px;
  color: ${({ theme }) => theme.palette.background.paper};
`;

const Tagline = styled(Typography)`
  display: block;
  color: rgba(255, 255, 255, 0.78);
  margin: 0 0 14px;
`;

const ColList = styled('ul')`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ColLink = styled(Link)`
  color: #d8ecf6;
  text-decoration: none;
  &:hover {
    color: ${({ theme }) => theme.palette.background.paper};
  }
`;

const SupportBtn = styled(Link)`
  height: 42px;
  padding: 0 22px;
  border-radius: 6px;
  border: 2px solid ${({ theme }) => theme.palette.background.paper};
  background: transparent;
  color: ${({ theme }) => theme.palette.background.paper};
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  transition: all 120ms ease;
  &:hover {
    background: ${({ theme }) => theme.palette.background.paper};
    color: ${({ theme }) => theme.palette.primary.main};
  }
`;

const FooterLogo = styled('img')`
  width: 180px;
  height: auto;
  display: block;
  margin-bottom: 16px;
  filter: brightness(0) invert(1);
`;

const Bottom = styled('div')`
  max-width: var(--max-width);
  margin: 24px auto 0;
  color: rgba(255, 255, 255, 0.55);
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
`;

const PoweredBy = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.78);
  text-decoration: none;
  transition: color 140ms;
  &:hover {
    color: ${({ theme }) => theme.palette.background.paper};
  }
`;

const WePublishLogo = styled('svg')`
  height: 22px;
  width: auto;
  display: block;

  .ee-wp-shape,
  .ee-wp-shape-clip {
    transition: d 0.45s cubic-bezier(0.55, 0.1, 0.25, 1);
  }

  ${PoweredBy}:hover & .ee-wp-shape,
  ${PoweredBy}:hover & .ee-wp-shape-clip {
    d: path('M4 0 L0 23.7 L43.9 23.7 L47.9 0 Z');
  }
`;

export const EenewsFooter = ({
  className,
  slug,
  categorySlugs,
  data,
}: BuilderFooterProps) => {
  const theme = useTheme();
  const themenSlug = categorySlugs?.[0]?.[0];
  const magazinSlug = categorySlugs?.[0]?.[1];

  const themen = themenSlug ? findNavBySlug(data, themenSlug) : undefined;
  const magazin = magazinSlug ? findNavBySlug(data, magazinSlug) : undefined;
  const konto = findNavBySlug(data, slug);

  const renderList = (nav: FullNavigationFragment | undefined) =>
    nav?.links.map((link, idx) => {
      const url = navigationLinkToUrl(link);
      if (!url) {
        return null;
      }
      return (
        <li key={`${link.label}-${idx}`}>
          <ColLink href={url}>
            <Typography
              variant="footerLink"
              component="span"
            >
              {link.label}
            </Typography>
          </ColLink>
        </li>
      );
    });

  return (
    <Wrapper className={className}>
      <Inner>
        <Col>
          <FooterLogo
            src="/ee-news-logo.png"
            alt="ee-news"
          />
          <Tagline variant="footerTag">
            Unabhängiger Journalismus zu erneuerbaren Energien, Energieeffizienz
            und Klima — mit Fokus Schweiz, Blick auf die Welt.
          </Tagline>
          <SupportBtn href="/mitmachen">
            <Typography
              variant="supportBtn"
              component="span"
            >
              Unterstützen
            </Typography>
          </SupportBtn>
        </Col>

        {themen && (
          <Col>
            <Heading variant="footerCol">{themen.name || 'Themen'}</Heading>
            <ColList>{renderList(themen)}</ColList>
          </Col>
        )}

        {magazin && (
          <Col>
            <Heading variant="footerCol">{magazin.name || 'Magazin'}</Heading>
            <ColList>{renderList(magazin)}</ColList>
          </Col>
        )}

        {konto && (
          <Col>
            <Heading variant="footerCol">{konto.name || 'Konto'}</Heading>
            <ColList>{renderList(konto)}</ColList>
          </Col>
        )}
      </Inner>

      <Bottom>
        <Typography
          variant="footerLink"
          component="span"
        >
          © {new Date().getFullYear()} ee-news — Erneuerbare Energien Schweiz
        </Typography>
        <PoweredBy
          href="https://wepublish.ch/"
          aria-label="Powered by We.Publish Foundation"
        >
          <Typography
            variant="footerLink"
            component="span"
          >
            Powered by
          </Typography>
          <WePublishLogo
            viewBox="0 0 141.6 23.7"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="We.Publish Logo"
          >
            <title>We.Publish — Das Ökosystem unabhängiger Medien</title>
            <defs>
              <clipPath id="ee-wp-clip">
                <path
                  className="ee-wp-shape-clip"
                  d="M47.9 0 L43.9 23.7 L137.6 23.7 L141.6 0 Z"
                />
              </clipPath>
            </defs>
            <rect
              width="141.6"
              height="23.7"
              fill={theme.palette.primary.main}
            />
            <g fill="currentColor">
              <path d="M73.6 10.3v3.2q0 2.4-1.8 2.4c-1.8 0-1.7-.8-1.7-2.2V7.3h-3.3v7.4c0 2.6 1.6 4.4 4 4.4s2.5-.5 3.2-1.4v1.2h3.2V7.1h-3.4v3.1h-.2zm21.8-3.8v12.1h3.3V3.4h-3.3zm10.3-3.1h-3.3v3.1h3.3zm-3.4 6.9v8.4h3.3V9.4h-3.3zm-44-3.4c-1.4 0-2.4.5-3.2 1.6V7.2h-4.6l-.5 3.1h1.8v11.8h3.3v-4.5c1.2 1 2 1.3 3.4 1.3 3 0 5.5-2.7 5.5-5.9s-2.6-6-5.7-6m-.4 8.7c-1.6 0-2.8-1.2-2.8-2.8s1.3-2.8 2.8-2.8 2.8 1.2 2.8 2.8-1.2 2.8-2.8 2.8m74.1-.2v-3.7c0-3-1.6-4.9-4-4.9s-2.4.6-3.1 1.8V3.4h-3.3v15.3h3.3v-6.1c0-1.5.7-2.3 2-2.3s1.9.7 1.9 2.4v6h4.5l.5-3.1H132zm-16.8-8.2c-.5-.4-1.2-.6-2-.6-2.4 0-4.3 1.7-4.3 3.8s.5 2.2 1.5 2.7c.7.5.9.5 3 1.1 1.2.4 1.6.6 1.6 1.2s-.5 1-1.2 1-1.7-.1-1.8-1h-2.8l-.5 2.9h3.1c.7.4 1.5.7 2.4.7 2.4 0 4.3-1.7 4.3-3.9s0-1-.3-1.5c-.5-1-1.2-1.5-2.7-2l-1.5-.4c-1.2-.3-1.5-.6-1.5-1.1s.5-.8 1.1-.8 1.5 0 1.6.8h2.8l.5-2.9zm-27.8-.4c-1.4 0-2.4.4-3.1 1.3V3.4h-4.6l-.5 3.1H81v12.1h3.3v-1.3c.9 1.1 1.9 1.5 3.2 1.5 3 0 5.5-2.7 5.5-6s-2.5-6-5.6-6m-.5 8.9c-1.5 0-2.7-1.3-2.7-2.8s1.2-2.8 2.7-2.8 2.7 1.2 2.7 2.8-1.2 2.8-2.7 2.8" />
              <path d="M34.9 17.4c-1.1 0-2.1-.6-2.6-1.5-.2-.3-.4-.8-.4-1.2 3.3.4 6.1-.3 7.8-1.9 1.1-1.1 1.6-2.5 1.4-4S39.6 6 37.8 5.6c-3.2-.7-5.8 1.5-7.2 3.9-.3.5-.6 1.1-.8 1.6-2.3-1.4-3.4-4.5-3.6-5.4v-.3l-2.6.7v.3c.7 2.9-.5 7.3-2.6 9.5-.9.9-1.8 1.3-2.6 1.1-.2 0-.7 0-1.1-1.3 0-.4-.2-.8-.2-1.3 1.5-3 2.6-6.7 1.9-8.1s.8-.9-1.4-.9-2.9 4.2-3.1 6v2.4c-.5.8-1.1 1.7-1.7 2.3-.8.8-1.6 1.2-2.3 1.1-.5 0-.9-.3-1.1-.8-.9-2 .2-6.6 1.9-9.5v-.3L8.9 5.3v.2c-.4.4-1.9 1.6-4.4 1.2l-.4 2.7c1.1.3 2.2.2 3.1 0-.8 2.8-1.2 6-.2 8.1.6 1.4 1.7 2.2 3.1 2.4 1.3.2 3.2-.1 5.2-2.5.6 1.2 1.5 2 2.7 2.3 1.8.4 3.6-.3 5.1-1.9s2.6-3.9 3.1-6.3c.8 1 1.8 1.9 3.1 2.5 0 1.2.3 2.3.8 3.3 1 1.8 2.9 2.9 4.9 2.9 2.4 0 4.6-1.1 5.8-2.6l-2.1-1.7c-.6.8-1.9 1.5-3.7 1.5zM32.3 12c.1-.3.3-.7.5-1 1.8-3 3.8-2.8 4.4-2.7.7.2 1.2.6 1.2.9 0 .7-.1 1.2-.6 1.7-.8.9-2.7 1.5-5.5 1.2z" />
            </g>
            <path
              className="ee-wp-shape"
              d="M47.9 0 L43.9 23.7 L137.6 23.7 L141.6 0 Z"
              fill="currentColor"
            />
            <g
              fill={theme.palette.primary.main}
              clipPath="url(#ee-wp-clip)"
            >
              <path d="M73.6 10.3v3.2q0 2.4-1.8 2.4c-1.8 0-1.7-.8-1.7-2.2V7.3h-3.3v7.4c0 2.6 1.6 4.4 4 4.4s2.5-.5 3.2-1.4v1.2h3.2V7.1h-3.4v3.1h-.2zm21.8-3.8v12.1h3.3V3.4h-3.3zm10.3-3.1h-3.3v3.1h3.3zm-3.4 6.9v8.4h3.3V9.4h-3.3zm-44-3.4c-1.4 0-2.4.5-3.2 1.6V7.2h-4.6l-.5 3.1h1.8v11.8h3.3v-4.5c1.2 1 2 1.3 3.4 1.3 3 0 5.5-2.7 5.5-5.9s-2.6-6-5.7-6m-.4 8.7c-1.6 0-2.8-1.2-2.8-2.8s1.3-2.8 2.8-2.8 2.8 1.2 2.8 2.8-1.2 2.8-2.8 2.8m74.1-.2v-3.7c0-3-1.6-4.9-4-4.9s-2.4.6-3.1 1.8V3.4h-3.3v15.3h3.3v-6.1c0-1.5.7-2.3 2-2.3s1.9.7 1.9 2.4v6h4.5l.5-3.1H132zm-16.8-8.2c-.5-.4-1.2-.6-2-.6-2.4 0-4.3 1.7-4.3 3.8s.5 2.2 1.5 2.7c.7.5.9.5 3 1.1 1.2.4 1.6.6 1.6 1.2s-.5 1-1.2 1-1.7-.1-1.8-1h-2.8l-.5 2.9h3.1c.7.4 1.5.7 2.4.7 2.4 0 4.3-1.7 4.3-3.9s0-1-.3-1.5c-.5-1-1.2-1.5-2.7-2l-1.5-.4c-1.2-.3-1.5-.6-1.5-1.1s.5-.8 1.1-.8 1.5 0 1.6.8h2.8l.5-2.9zm-27.8-.4c-1.4 0-2.4.4-3.1 1.3V3.4h-4.6l-.5 3.1H81v12.1h3.3v-1.3c.9 1.1 1.9 1.5 3.2 1.5 3 0 5.5-2.7 5.5-6s-2.5-6-5.6-6m-.5 8.9c-1.5 0-2.7-1.3-2.7-2.8s1.2-2.8 2.7-2.8 2.7 1.2 2.7 2.8-1.2 2.8-2.7 2.8" />
              <path d="M34.9 17.4c-1.1 0-2.1-.6-2.6-1.5-.2-.3-.4-.8-.4-1.2 3.3.4 6.1-.3 7.8-1.9 1.1-1.1 1.6-2.5 1.4-4S39.6 6 37.8 5.6c-3.2-.7-5.8 1.5-7.2 3.9-.3.5-.6 1.1-.8 1.6-2.3-1.4-3.4-4.5-3.6-5.4v-.3l-2.6.7v.3c.7 2.9-.5 7.3-2.6 9.5-.9.9-1.8 1.3-2.6 1.1-.2 0-.7 0-1.1-1.3 0-.4-.2-.8-.2-1.3 1.5-3 2.6-6.7 1.9-8.1s.8-.9-1.4-.9-2.9 4.2-3.1 6v2.4c-.5.8-1.1 1.7-1.7 2.3-.8.8-1.6 1.2-2.3 1.1-.5 0-.9-.3-1.1-.8-.9-2 .2-6.6 1.9-9.5v-.3L8.9 5.3v.2c-.4.4-1.9 1.6-4.4 1.2l-.4 2.7c1.1.3 2.2.2 3.1 0-.8 2.8-1.2 6-.2 8.1.6 1.4 1.7 2.2 3.1 2.4 1.3.2 3.2-.1 5.2-2.5.6 1.2 1.5 2 2.7 2.3 1.8.4 3.6-.3 5.1-1.9s2.6-3.9 3.1-6.3c.8 1 1.8 1.9 3.1 2.5 0 1.2.3 2.3.8 3.3 1 1.8 2.9 2.9 4.9 2.9 2.4 0 4.6-1.1 5.8-2.6l-2.1-1.7c-.6.8-1.9 1.5-3.7 1.5zM32.3 12c.1-.3.3-.7.5-1 1.8-3 3.8-2.8 4.4-2.7.7.2 1.2.6 1.2.9 0 .7-.1 1.2-.6 1.7-.8.9-2.7 1.5-5.5 1.2z" />
            </g>
          </WePublishLogo>
        </PoweredBy>
        <Typography
          variant="footerLink"
          component="span"
        >
          Made in Switzerland 🇨🇭
        </Typography>
      </Bottom>
    </Wrapper>
  );
};
