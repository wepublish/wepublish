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
  column-gap: 3rem;

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

export function WepFooter({
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

  const mainItems = data?.navigations?.filter(({ key }) => key === slug) ?? [];

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
  background-color: ${({ theme }) => theme.palette.primary.dark};
  color: ${({ theme }) => theme.palette.common.white};
  display: grid;
  grid-template-rows: repeat(3, auto);
  grid-template-columns: repeat(2, auto);
  padding: ${({ theme }) => theme.spacing(5, 2, 10, 2)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-rows: min-content;
    grid-template-columns:
      1fr minmax(
        max-content,
        calc(var(--container-max-width) - ${({ theme }) => theme.spacing(6)})
      )
      1fr;
    padding: 3rem ${({ theme }) => theme.spacing(3)} 10rem
      ${({ theme }) => theme.spacing(3)};
    row-gap: 0;
  }
`;

export const FooterCategory = styled(FooterCategoryDefault)``;

export const FooterLinksGroup = styled('div')`
  display: grid;
  grid-column: -1 / 1;
  grid-row: 1 / 4;
  grid-template-columns: subgrid;
  grid-template-rows: subgrid;
  row-gap: ${({ theme }) => theme.spacing(3)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: repeat(6, auto);
    grid-row: 1 / 2;
    grid-column: 2 / 3;
  }
`;

const WepLogo = styled('img')`
  width: 150px;
  ${({ theme }) => theme.breakpoints.up('md')} {
    width: 220px;
  }
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

export const FooterPaper = ({
  main,
  categories,
  children,
}: PropsWithChildren<{
  main: FullNavigationFragment[];
  categories: FullNavigationFragment[][];
}>) => {
  return (
    <FooterPaperWrapper>
      {categories.map((categoryArray, arrayIndex) => (
        <FooterLinksGroup key={arrayIndex}>
          <FooterCategory>
            <WepLogo
              src="/wepublish-logo-alt.svg"
              alt="WePublish Logo"
            />
            <Typography variant="categoryAddress">
              <Typography variant="categoryAddressText">
                We.Publish Foundation
                <br />
                c/o Manuel Bertschi
                <br />
                Friedensgasse 52
                <br />
                4056 Basel
              </Typography>
            </Typography>
          </FooterCategory>
          {[...main, ...categoryArray].map(nav => (
            <FooterCategory key={nav.id ? nav.id : 'main'}>
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
