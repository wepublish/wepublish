import styled from '@emotion/styled';
import { css, Theme } from '@mui/material';
import { forceHideBanner } from '@wepublish/banner/website';
import {
  FooterCategory as FooterCategoryDefault,
  FooterIcons as FooterIconsDefault,
  FooterIconsWrapper as FooterIconsWrapperDefault,
  FooterName as FooterNameDefault,
  navigationLinkToUrl,
} from '@wepublish/navigation/website';
import { FullNavigationFragment } from '@wepublish/website/api';
import {
  BuilderFooterProps,
  Link,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { IconButton } from '@wepublish/website/builder';
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
  gap: 1.5cqw;
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
  point-events: none;
  visibility: hidden;
  grid-column: 4 / 5;
  display: none;

  ${theme.breakpoints.up('md')} {
    display: block;
  }
`;

export const FooterIconsWrapper = styled(FooterIconsWrapperDefault)``;

export const FooterIcons = styled(FooterIconsDefault)``;

export const FooterSupportWrapper = styled('div')`
  display: grid;
  grid-template-columns: unset;

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: 1fr minmax(max-content, 1285px) 1fr;
  }
`;

export const FooterSupport = styled('div')`
  grid-column: unset;
  background-color: ${({ theme }) => theme.palette.common.black};
  color: ${({ theme }) => theme.palette.common.white};
  border-top-left-radius: 1em;
  border-top-right-radius: 1em;
  background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMTgiIHZpZXdCb3g9IjAgMCAyMCAxOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTAuMDAxMDQ5OTggNS42MzJDMC4wMDEwNDk5OCAyLjQ5NiAyLjMwNTA1IDAgNS41MDUwNSAwQzguNzA1MDUgMCA5LjkyMTA1IDEuNzkyIDkuOTIxMDUgMS43OTJDOS45MjEwNSAxLjc5MiAxMS4xMzcgMCAxNC4zMzcgMEMxNy41MzcgMCAxOS44NDExIDIuNDk2IDE5Ljg0MTEgNS42MzJDMTkuODQxMSA4LjU3NiAxNy4wMjUgMTEuMDcyIDE2LjE5MzEgMTEuOTA0QzE1LjM2MTEgMTIuNzM2IDkuOTIxMDUgMTcuOTg0IDkuOTIxMDUgMTcuOTg0QzkuOTIxMDUgMTcuOTg0IDQuNDgxMDUgMTIuNzM2IDMuNjQ5MDUgMTEuOTA0QzIuODE3MDUgMTEuMDcyIC0wLjA2Mjk1IDguNTEyIDAuMDAxMDQ5OTggNS42MzJaIiBmaWxsPSIjMEM5RkVEIi8+Cjwvc3ZnPgo=');
  background-repeat: no-repeat;
  background-position: top 1rem center;
  background-size: 20px auto;
  padding: 4rem 2rem 1.5rem 2rem;

  & > * {
    max-width: 700px;
    text-align: center;
    hyphens: none;
    padding: 0;
    margin: 0 auto !important;
    line-height: 1rem !important;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-column: 2 / 3;
  }
`;

export const FooterSupportHeading = styled('h6')`
  color: ${({ theme }) => theme.palette.primary.main};
  font-weight: 700 !important;
  font-size: 0.8rem !important;
`;

export const FooterSupportText = styled('p')`
  margin: 0 auto 1.5rem auto !important;
  font-weight: 400 !important;
  color: ${({ theme }) => theme.palette.common.white};
  font-size: 0.8rem !important;
`;

export const FooterSupportImprint = styled('p')`
  font-size: 0.65rem !important;
  line-height: 0.8rem !important;
  padding-top: 2rem !important;
`;

export function Footer({
  className,
  categorySlugs,
  slug,
  iconSlug,
  data,
  loading,
  error,
  hideBannerOnIntersecting,
  wepublishLogo,
  children,
}: BuilderFooterProps) {
  const { isIntersecting, ref } = useIntersectionObserver({
    initialIsIntersecting: false,
    threshold: 0.9,
  });
  const {
    elements: { H6, Paragraph },
  } = useWebsiteBuilder();

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

  const iconItems = data?.navigations?.find(({ key }) => key === iconSlug);

  return (
    <FooterWrapper
      className={className}
      ref={ref}
    >
      <FooterSupportWrapper>
        <FooterSupport>
          <H6 component={FooterSupportHeading}>Hallo Welt!</H6>
          <Paragraph component={FooterSupportText}>
            Tsüri ist ein unabhängiges Medium für unsere Stadt. Wir stehen für
            vertrauenswürdigen und kritischen Journalismus.
            <br />
            Unabhängigkeit, Fairness, Transparenz und Glaubwürdigkeit sind unser
            Fundament.
          </Paragraph>
          <H6 component={FooterSupportHeading}>Werde Teil von Tsüri</H6>
          <Paragraph component={FooterSupportText}>
            Im Gegensatz zu vielen anderen Medienhäusern gehören wir keinem
            Grosskonzern – und wir werden auch nicht von Superreichen
            finanziert. Unser Journalismus lebt von der Community. Über 2000
            Tsüri-Member unterstützen uns bereits.
            <br />
            Werde auch du Teil davon!
          </Paragraph>
          <H6 component={FooterSupportHeading}>
            Du willst Menschen in Zürich erreichen?
          </H6>
          <Paragraph component={FooterSupportText}>
            Dann bist du bei uns richtig. Emilio zeigt dir gerne, wie du mit
            deinem Unternehmen Teil unserer Community wirst und welche
            Möglichkeiten es gibt.
          </Paragraph>
          <H6 component={FooterSupportHeading}>
            Civic Media heisst gemeinsam etwas bewegen
          </H6>
          <Paragraph component={FooterSupportText}>
            Wir wollen etwas bewegen – gemeinsam mit dir. Nicht für Klicks,
            sondern für Austausch, Beteiligung und Erlebnisse.
            <br />
            Analog und digital. Das nennen wir Civic Media. Hier gehts zu
            unserem Engagement.
          </Paragraph>
          <Paragraph component={FooterSupportImprint}>
            Copyright © 2025 Tsüri AG
            <br />
            All rights reserved. Tsüri AG, Flüelastrasse 12, 8048 Zürich
          </Paragraph>
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

export const LinkGroup = styled('div')``;

export const CategoryLinkTitle = styled('h6')`
  font-weight: 700 !important;
  color: ${({ theme }) => theme.palette.common.white};
  display: inline-block;
  white-space: nowrap;
  margin: 0;
  padding: 0 0.3cqw;
  font-size: 4.5cqw !important;
  line-height: 6cqw !important;

  ${({ theme }) => theme.breakpoints.up('md')} {
    font-size: min(1.25cqw, 1.4rem) !important;
    line-height: min(1.66cqw, 1.86rem) !important;
  }
`;

export const CategoryLinkList = styled('ul')`
  list-style: none;
  margin: 0;
  padding: 0;
  font-weight: 700 !important;
  font-size: 4.5cqw !important;
  line-height: 6cqw !important;

  ${({ theme }) => theme.breakpoints.up('md')} {
    font-size: min(1.25cqw, 1.4rem) !important;
    line-height: min(1.66cqw, 1.86rem) !important;
  }
`;

export const CategoryLinkItem = styled('li')`
  list-style: none;
  margin: 0;
  padding: 0;
`;

export const CategoryLink = styled(Link)`
  color: inherit;
  display: inline-block;
  white-space: nowrap;
  padding: 0 0.3cqw;
  text-decoration: none;

  &:hover {
    background-color: ${({ theme }) => theme.palette.primary.light};
    text-decoration: none;
  }
`;

export const footerTabStyles = () => css``;

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

const LoginTab = styled('button')`
  background-color: ${({ theme }) => theme.palette.common.black};
  color: ${({ theme }) => theme.palette.common.white};
  text-align: left;
  user-select: none;
  cursor: pointer;
  box-sizing: border-box;
  font-weight: 700;
  font-size: 4.5cqw !important;
  line-height: 4.5cqw !important;
  padding: 2cqw 3cqw;
  border: 0;
  outline: 0;
  border-radius: 0;
  border-bottom-left-radius: 2cqw;
  border-bottom-right-radius: 2cqw;
  grid-column: -1 / 1;

  &:hover {
    background-color: ${({ theme }) => theme.palette.primary.light};
    color: ${({ theme }) => theme.palette.common.black};
  }

  & > * {
    text-decoration: none;
    color: inherit;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    font-size: 0.75cqw !important;
    line-height: 0.75cqw !important;
    padding: 0.5cqw 0.75cqw;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    border-top-left-radius: 0.5cqw;
    border-top-right-radius: 0.5cqw;
    box-sizing: border-box;
    grid-column: 2/3;
    grid-row: 1/2;
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
    grid-template-columns: 1fr minmax(max-content, 1285px) 1fr;
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
    grid-column: unset !important;
    grid-row: unset !important;
    padding: 0;
  }
`;

export const FooterName = styled(FooterNameDefault)``;

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

export const FooterPaperLink = styled(Link)``;

export const FooterCategoryLinks = styled(CategoryLinkList)`
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 4.5cqw !important;
  line-height: 6cqw !important;

  ${({ theme }) => theme.breakpoints.up('md')} {
    font-weight: 700 !important;
    font-size: min(1.25cqw, 1.4rem) !important;
    line-height: min(1.66cqw, 1.86rem) !important;
  }
`;

export const FooterMainLinks = styled(FooterCategoryLinks)``;

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
              {nav.name && <CategoryLinkTitle>{nav.name}</CategoryLinkTitle>}

              <FooterCategoryLinks>
                {nav.links?.map((link, index) => (
                  <CategoryLinkItem key={index}>
                    <CategoryLink href={navigationLinkToUrl(link)}>
                      {link.label}
                    </CategoryLink>
                  </CategoryLinkItem>
                ))}
              </FooterCategoryLinks>
            </FooterCategory>
          ))}
        </FooterLinksGroup>
      ))}
      {children}
      <FooterTabs>
        <LoginTab>
          <Link href="/login">Login</Link>
        </LoginTab>
      </FooterTabs>
    </FooterPaperWrapper>
  );
};
