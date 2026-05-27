import styled from '@emotion/styled';
import { css, Theme, Typography } from '@mui/material';
import { useUser } from '@wepublish/authentication/website';
import { forceHideBanner } from '@wepublish/banner/website';
import {
  FooterCategory as FooterCategoryDefault,
  navigationLinkToUrl,
} from '@wepublish/navigation/website';
import { FullNavigationFragment } from '@wepublish/website/api';
import { Link } from '@wepublish/website/builder';
import { BuilderFooterProps, IconButton } from '@wepublish/website/builder';
import { useRouter } from 'next/router';
import { PropsWithChildren } from 'react';
import { FiInstagram, FiSearch } from 'react-icons/fi';
import { useIntersectionObserver } from 'usehooks-ts';

import theme from '../theme';

export const FooterWrapper = styled('footer')`
  display: grid;
  grid-template-rows: repeat(2, min-content);
`;

export const FooterMain = styled('div')`
  grid-column: 2 / 3;
  grid-row: 2 / 3;
  container: footer-main/inline-size;
  display: flex;
  flex-direction: row;
  align-content: flex-end;
  justify-content: flex-end;
  column-gap: 2.5cqw;
  padding-right: 2cqw;

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-row: 1/2;
    grid-column: 2/3;
    margin: 0 2.5% 0 0;
    padding: 0;
    gap: unset;
    justify-content: unset;
    align-content: unset;
    column-gap: 0.9%;
    display: grid;
    grid-template-columns: auto repeat(3, min-content);
    align-items: center;
    justify-self: end;
    align-self: flex-start;
    width: 100%;
    padding-right: 0;
  }
`;

export const footerButtonStyles = (theme: Theme) => css`
  padding: 0;
  background-color: ${theme.palette.common.black};
  border-radius: 50%;
  width: 28cqw;
  height: 28cqw;

  & > svg {
    stroke-width: 1.25px;
    stroke: ${theme.palette.common.white};
    font-size: 18cqw;
  }

  &:hover {
    background-color: ${theme.palette.primary.light};
    > svg {
      stroke: ${theme.palette.common.black};
    }
  }

  ${theme.breakpoints.up('md')} {
    width: 3.917442cqw;
    height: 3.917442cqw;

    & > svg {
      font-size: 2.5cqw;
    }
  }
`;

export const FooterInstaButton = styled(IconButton)`
  ${footerButtonStyles(theme)}
  grid-column: 2 / 3;
`;

export const FooterSearchButton = styled(IconButton)`
  ${footerButtonStyles(theme)}
  grid-column: 3 / 4;
`;

export const PlaceholderButton = styled(IconButton)`
  ${footerButtonStyles(theme)}
  pointer-events: none;
  visibility: hidden;
  grid-column: 4 / 5;
  display: none;

  ${theme.breakpoints.up('md')} {
    display: block;
  }
`;

export const FooterSupportWrapper = styled('div')`
  display: grid;
  grid-template-columns: unset;
  background-color: ${({ theme }) => theme.palette.common.black};

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: 1fr minmax(max-content, 1075px) 1fr;
  }
`;

export const FooterSupport = styled('div')`
  grid-column: unset;
  background-color: ${({ theme }) => theme.palette.common.black};
  color: ${({ theme }) => theme.palette.common.white};
  border-top-left-radius: 1em;
  border-top-right-radius: 1em;
  background-image: url(/heart.svg);
  background-repeat: no-repeat;
  background-position: top 1rem center;
  background-size: 20px auto;
  padding: 4rem 2rem 1.5rem 2rem;

  & > .MuiTypography-root {
    max-width: 780px;
    text-align: center;
    hyphens: none;
    padding: 0;
    display: block;
    text-decoration: none;
    margin: 0 auto;

    &:hover {
      text-decoration: none;

      & > *:first-child {
        text-decoration: underline;
        text-decoration-thickness: 1px;
      }
    }
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-column: 2 / 3;
  }
`;

const WePublishLogo = styled('svg')`
  margin: 0.3rem 0 1rem 0;
  width: 100px;
  height: auto;
  isolation: isolate;

  .bg-shape {
    transition: d 0.4s ease;
  }

  &:hover .bg-shape {
    d: path('M4 0 L0 23.7 L43.9 23.7 L47.9 0 Z');
  }

  .text {
    mix-blend-mode: difference;
  }
`;

export function Footer({
  className,
  categorySlugs,
  slug,
  data,
  hideBannerOnIntersecting,
  children,
}: BuilderFooterProps) {
  const { isIntersecting, ref } = useIntersectionObserver({
    initialIsIntersecting: false,
    threshold: 0.9,
  });

  const mainItems = data?.navigations?.find(({ key }) => key === slug);

  const categories = categorySlugs.map(categorySlugArray => {
    return categorySlugArray.reduce((navigations, categorySlug) => {
      const navItem = data?.navigations?.find(
        ({ key }) => key === categorySlug
      );

      if (navItem) {
        navigations.push(navItem);
      }

      return navigations;
    }, [] as FullNavigationFragment[]);
  });

  return (
    <FooterWrapper
      className={className}
      ref={ref}
    >
      <FooterSupportWrapper>
        <FooterSupport>
          <Link href="/ueber-tsri">
            <Typography variant="footerSupportHeading">Hallo Welt!</Typography>
            <Typography variant="footerSupportText">
              Tsüri ist ein unabhängiges Medium für unsere Stadt. Wir stehen für
              vertrauenswürdigen und kritischen Journalismus.
              <br />
              Unabhängigkeit, Fairness, Transparenz und Glaubwürdigkeit sind
              unser Fundament.
            </Typography>
          </Link>
          <Link href="/mitmachen">
            <Typography variant="footerSupportHeading">
              Werde Teil von Tsüri
            </Typography>
            <Typography variant="footerSupportText">
              Im Gegensatz zu vielen anderen Medienhäusern gehören wir keinem
              Grosskonzern – und wir werden auch nicht von Superreichen
              finanziert. Unser Journalismus lebt von der Community. Über 3000
              Tsüri-Member unterstützen uns bereits.
              <br />
              Werde auch du Teil davon!
            </Typography>
          </Link>
          <Link href="/werben">
            <Typography variant="footerSupportHeading">
              Du willst Menschen in Zürich erreichen?
            </Typography>
            <Typography variant="footerSupportText">
              Dann bist du bei uns richtig. Emilio zeigt dir gerne, wie du mit
              deinem Unternehmen Teil unserer Community wirst und welche
              Möglichkeiten es gibt.
            </Typography>
          </Link>
          <Link href="/civic-media">
            <Typography variant="footerSupportHeading">
              Civic Media heisst gemeinsam etwas bewegen
            </Typography>
            <Typography variant="footerSupportText">
              Wir wollen etwas bewegen – gemeinsam mit dir. Nicht für Klicks,
              sondern für Austausch, Beteiligung und Erlebnisse.
              <br />
              Analog und digital. Das nennen wir Civic Media. Hier gehts zu
              unserem Engagement.
            </Typography>
          </Link>
          <Typography variant="footerSupportImprint">
            Copyright © 2025 Tsüri AG
            <br />
            All rights reserved. Tsüri AG, Flüelastrasse 12, 8048 Zürich
          </Typography>
          <Typography variant="footerSupportImprint">
            <br />
            Powered by
            <br />
            <Link
              href="https://wepublish.ch"
              target="_blank"
              rel="noopener noreferrer"
            >
              <WePublishLogo
                viewBox="0 0 141.6 23.7"
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label="WePublish Logo"
              >
                <title>We.Publish - Das Ökosystem unabhängiger Medien</title>
                <rect
                  width="141.6"
                  height="23.7"
                  fill="black"
                />
                <path
                  className="bg-shape"
                  d="M47.9 0 L43.9 23.7 L137.6 23.7 L141.6 0 Z"
                  fill="white"
                />
                <g
                  className="text"
                  fill="white"
                >
                  <path d="M73.6 10.3v3.2q0 2.4-1.8 2.4c-1.8 0-1.7-.8-1.7-2.2V7.3h-3.3v7.4c0 2.6 1.6 4.4 4 4.4s2.5-.5 3.2-1.4v1.2h3.2V7.1h-3.4v3.1h-.2zm21.8-3.8v12.1h3.3V3.4h-3.3zm10.3-3.1h-3.3v3.1h3.3zm-3.4 6.9v8.4h3.3V9.4h-3.3zm-44-3.4c-1.4 0-2.4.5-3.2 1.6V7.2h-4.6l-.5 3.1h1.8v11.8h3.3v-4.5c1.2 1 2 1.3 3.4 1.3 3 0 5.5-2.7 5.5-5.9s-2.6-6-5.7-6m-.4 8.7c-1.6 0-2.8-1.2-2.8-2.8s1.3-2.8 2.8-2.8 2.8 1.2 2.8 2.8-1.2 2.8-2.8 2.8m74.1-.2v-3.7c0-3-1.6-4.9-4-4.9s-2.4.6-3.1 1.8V3.4h-3.3v15.3h3.3v-6.1c0-1.5.7-2.3 2-2.3s1.9.7 1.9 2.4v6h4.5l.5-3.1H132zm-16.8-8.2c-.5-.4-1.2-.6-2-.6-2.4 0-4.3 1.7-4.3 3.8s.5 2.2 1.5 2.7c.7.5.9.5 3 1.1 1.2.4 1.6.6 1.6 1.2s-.5 1-1.2 1-1.7-.1-1.8-1h-2.8l-.5 2.9h3.1c.7.4 1.5.7 2.4.7 2.4 0 4.3-1.7 4.3-3.9s0-1-.3-1.5c-.5-1-1.2-1.5-2.7-2l-1.5-.4c-1.2-.3-1.5-.6-1.5-1.1s.5-.8 1.1-.8 1.5 0 1.6.8h2.8l.5-2.9zm-27.8-.4c-1.4 0-2.4.4-3.1 1.3V3.4h-4.6l-.5 3.1H81v12.1h3.3v-1.3c.9 1.1 1.9 1.5 3.2 1.5 3 0 5.5-2.7 5.5-6s-2.5-6-5.6-6m-.5 8.9c-1.5 0-2.7-1.3-2.7-2.8s1.2-2.8 2.7-2.8 2.7 1.2 2.7 2.8-1.2 2.8-2.7 2.8" />
                  <path d="M34.9 17.4c-1.1 0-2.1-.6-2.6-1.5-.2-.3-.4-.8-.4-1.2 3.3.4 6.1-.3 7.8-1.9 1.1-1.1 1.6-2.5 1.4-4S39.6 6 37.8 5.6c-3.2-.7-5.8 1.5-7.2 3.9-.3.5-.6 1.1-.8 1.6-2.3-1.4-3.4-4.5-3.6-5.4v-.3l-2.6.7v.3c.7 2.9-.5 7.3-2.6 9.5-.9.9-1.8 1.3-2.6 1.1-.2 0-.7 0-1.1-1.3 0-.4-.2-.8-.2-1.3 1.5-3 2.6-6.7 1.9-8.1s.8-.9-1.4-.9-2.9 4.2-3.1 6v2.4c-.5.8-1.1 1.7-1.7 2.3-.8.8-1.6 1.2-2.3 1.1-.5 0-.9-.3-1.1-.8-.9-2 .2-6.6 1.9-9.5v-.3L8.9 5.3v.2c-.4.4-1.9 1.6-4.4 1.2l-.4 2.7c1.1.3 2.2.2 3.1 0-.8 2.8-1.2 6-.2 8.1.6 1.4 1.7 2.2 3.1 2.4 1.3.2 3.2-.1 5.2-2.5.6 1.2 1.5 2 2.7 2.3 1.8.4 3.6-.3 5.1-1.9s2.6-3.9 3.1-6.3c.8 1 1.8 1.9 3.1 2.5 0 1.2.3 2.3.8 3.3 1 1.8 2.9 2.9 4.9 2.9 2.4 0 4.6-1.1 5.8-2.6l-2.1-1.7c-.6.8-1.9 1.5-3.7 1.5zM32.3 12c.1-.3.3-.7.5-1 1.8-3 3.8-2.8 4.4-2.7.7.2 1.2.6 1.2.9 0 .7-.1 1.2-.6 1.7-.8.9-2.7 1.5-5.5 1.2z" />
                </g>
              </WePublishLogo>
            </Link>
          </Typography>
        </FooterSupport>
      </FooterSupportWrapper>

      <FooterPaper
        main={mainItems}
        categories={categories}
        children={children} // eslint-disable-line react/no-children-prop
      />

      {isIntersecting && hideBannerOnIntersecting && forceHideBanner}
    </FooterWrapper>
  );
}

const FooterTabs = styled('div')`
  display: grid;
  grid-template-rows: min-content;
  grid-template-colums: subgrid;
  margin: 0 auto;
  align-self: flex-end;
  pointer-events: all;
  grid-column: -1 / 1;
  grid-row: 1 / 2;
  visibility: visible;
  transition: visibility 300ms ease-in-out;
  width: 100%;

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-column: 2 / 3;
    grid-row: 2 / 3;
    grid-template-columns: var(--two-column-grid-no-gap);
    width: 100%;
  }
`;

const LoginTab = styled(Link)`
  background-color: ${({ theme }) => theme.palette.common.black};
  color: ${({ theme }) => theme.palette.common.white};
  text-align: left;
  user-select: none;
  cursor: pointer;
  box-sizing: border-box;
  font-weight: 700;
  font-size: 4.5cqw;
  line-height: 4.5cqw;
  padding: 2cqw 3cqw;
  border: 0;
  outline: 0;
  border-radius: 0;
  border-bottom-left-radius: 2cqw;
  border-bottom-right-radius: 2cqw;
  grid-column: -1 / 1;
  text-decoration: none;

  &:hover {
    background-color: ${({ theme }) => theme.palette.primary.light};
    color: ${({ theme }) => theme.palette.common.black};
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    font-size: 1cqw;
    line-height: 1cqw;
    padding: 0.5cqw 0.75cqw;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    border-top-left-radius: 0.5cqw;
    border-top-right-radius: 0.5cqw;
    box-sizing: border-box;
    grid-column: 2/3;
    grid-row: 1/2;
  }

  ${theme.breakpoints.up('xl')} {
    padding: 0.25cqw 1cqw;
    font-size: 0.85cqw;
  }
`;

export const FooterPaperWrapper = styled('div')`
  background: linear-gradient(
    to bottom,
    color-mix(
      in srgb,
      ${({ theme }) => theme.palette.common.white} 40%,
      ${({ theme }) => theme.palette.primary.main} 60%
    ),
    ${({ theme }) => theme.palette.primary.main}
  );
  color: ${({ theme }) => theme.palette.common.black};
  display: grid;
  grid-template-rows: repeat(3, auto);
  grid-template-columns: repeat(2, auto);
  row-gap: 10cqw;
  padding: 0 ${({ theme }) => theme.spacing(2)} 20cqw
    ${({ theme }) => theme.spacing(2)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-rows: min-content 6cqw;
    grid-template-columns: 1fr minmax(max-content, 1075px) 1fr;
    padding: 1cqw ${({ theme }) => theme.spacing(3)} 0
      ${({ theme }) => theme.spacing(3)};
    row-gap: 0;
  }
`;

export const FooterCategory = styled(FooterCategoryDefault)`
  grid-column: 1 / 2;
  grid-row: 2 / 3;
  row-gap: 0;
  padding-left: 2cqw;
  max-width: 44vw;
  overflow: hidden;

  &:nth-of-type(n + 2) {
    grid-column: 1 / 2;
    grid-row: 3 / 4;
  }

  &:nth-of-type(n + 3) {
    grid-column: 2 / 3;
    grid-row: 3 / 4;
    padding-left: 0;
    padding-right: 2cqw;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    &:nth-of-type(n) {
      grid-column: unset;
      grid-row: unset;
      padding: 0;
    }
  }
`;

export const FooterLinksGroup = styled('div')`
  display: grid;
  grid-column: -1 / 1;
  grid-row: 1 / 4;
  grid-template-columns: subgrid;
  grid-template-rows: subgrid;

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: repeat(3, min-content);
    column-gap: 2cqw;
    grid-row: 1 / 2;
    grid-column: 2 / 3;
    margin: 0 0 0 3cqw;
  }
`;

export const TsriFooter = styled(Footer)``;

export const FooterPaper = ({
  main,
  categories,
  children,
}: PropsWithChildren<{
  main: FullNavigationFragment | null | undefined;
  categories: FullNavigationFragment[][];
}>) => {
  const router = useRouter();
  const { hasUser, logout } = useUser();

  return (
    <FooterPaperWrapper>
      <FooterMain>
        <FooterInstaButton
          size="small"
          title="Instagram"
          aria-label="Instagram"
          color={'inherit'}
          onClick={() => router.push('https://www.instagram.com/tsri.ch/')}
        >
          <FiInstagram />
        </FooterInstaButton>
        <FooterSearchButton
          size="small"
          aria-label="Suche"
          title="Suche"
          color={'inherit'}
          onClick={() => router.push('/search')}
        >
          <FiSearch />
        </FooterSearchButton>
        <PlaceholderButton size="small" />
      </FooterMain>
      {categories.map((categoryArray, arrayIndex) => (
        <FooterLinksGroup key={arrayIndex}>
          {categoryArray.map(nav => (
            <FooterCategory key={nav.id}>
              {nav.name && (
                <Typography variant="categoryLinkTitle">{nav.name}</Typography>
              )}
              <Typography variant="categoryLinkList">
                {nav.links?.map((link, index) => (
                  <Typography
                    variant="categoryLinkItem"
                    key={index}
                  >
                    <Link
                      variant={'categoryLink'}
                      href={navigationLinkToUrl(link)}
                    >
                      {link.label}
                    </Link>
                  </Typography>
                ))}
              </Typography>
            </FooterCategory>
          ))}
        </FooterLinksGroup>
      ))}
      {children}
      <FooterTabs>
        {hasUser && (
          <LoginTab
            onClick={() => {
              logout();
            }}
            href={router.asPath}
          >
            Logout
          </LoginTab>
        )}
        {!hasUser && <LoginTab href={'/login'}>Login</LoginTab>}
      </FooterTabs>
    </FooterPaperWrapper>
  );
};
