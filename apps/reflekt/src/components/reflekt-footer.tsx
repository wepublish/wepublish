import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { forceHideBanner } from '@wepublish/banner/website';
import {
  FooterCategory as FooterCategoryDefault,
  navigationLinkToUrl,
} from '@wepublish/navigation/website';
import { FullNavigationFragment } from '@wepublish/website/api';
import { Link } from '@wepublish/website/builder';
import { BuilderFooterProps } from '@wepublish/website/builder';
import { PropsWithChildren } from 'react';
import { useIntersectionObserver } from 'usehooks-ts';

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
      <FooterPaper
        main={mainItems}
        categories={categories}
        children={children} // eslint-disable-line react/no-children-prop
      />

      {isIntersecting && hideBannerOnIntersecting && forceHideBanner}
    </FooterWrapper>
  );
}

export const FooterPaperWrapper = styled('div')`
  background-color: ${({ theme }) => theme.palette.primary.main};
  color: ${({ theme }) => theme.palette.common.white};
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

export const RefFooter = styled(Footer)``;

export const FooterPaper = ({
  main,
  categories,
  children,
}: PropsWithChildren<{
  main: FullNavigationFragment | null | undefined;
  categories: FullNavigationFragment[][];
}>) => {
  return (
    <FooterPaperWrapper>
      {categories.map((categoryArray, arrayIndex) => (
        <FooterLinksGroup key={arrayIndex}>
          {categoryArray.map(nav => (
            <FooterCategory key={nav.id}>
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
    </FooterPaperWrapper>
  );
};
