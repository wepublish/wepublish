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

  & > * {
    max-width: 780px;
    text-align: center;
    hyphens: none;
    padding: 0;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-column: 2 / 3;
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
          <Typography variant="footerSupportHeading">Hallo Welt!</Typography>
          <Typography variant="footerSupportText">
            Tsüri ist ein unabhängiges Medium für unsere Stadt. Wir stehen für
            vertrauenswürdigen und kritischen Journalismus.
            <br />
            Unabhängigkeit, Fairness, Transparenz und Glaubwürdigkeit sind unser
            Fundament.
          </Typography>
          <Typography variant="footerSupportHeading">
            Werde Teil von Tsüri
          </Typography>
          <Typography variant="footerSupportText">
            Im Gegensatz zu vielen anderen Medienhäusern gehören wir keinem
            Grosskonzern – und wir werden auch nicht von Superreichen
            finanziert. Unser Journalismus lebt von der Community. Über 2000
            Tsüri-Member unterstützen uns bereits.
            <br />
            Werde auch du Teil davon!
          </Typography>
          <Typography variant="footerSupportHeading">
            Du willst Menschen in Zürich erreichen?
          </Typography>
          <Typography variant="footerSupportText">
            Dann bist du bei uns richtig. Emilio zeigt dir gerne, wie du mit
            deinem Unternehmen Teil unserer Community wirst und welche
            Möglichkeiten es gibt.
          </Typography>
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
          <Typography variant="footerSupportImprint">
            Copyright © 2025 Tsüri AG
            <br />
            All rights reserved. Tsüri AG, Flüelastrasse 12, 8048 Zürich
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
  row-gap: 0.8cqw;
  padding-left: 2cqw;
  max-width: 44vw;
  overflow-x: hidden;

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
