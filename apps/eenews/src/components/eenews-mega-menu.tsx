import styled from '@emotion/styled';
import { css, Typography } from '@mui/material';
import {
  FullNavigationFragment,
  NavigationListQuery,
} from '@wepublish/website/api';
import { Link } from '@wepublish/website/builder';

import { eenewsColors } from '../theme';

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

const MegaOverlay = styled('div', {
  shouldForwardProp: p => p !== 'isOpen',
})<{ isOpen: boolean }>`
  position: absolute;
  top: 90px;
  left: 0;
  right: 0;
  z-index: 5;
  display: block;
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  padding: 0;
  background-image: linear-gradient(
    90deg,
    #b6e9a8 0%,
    #abe1b5 35%,
    #98d6c0 65%,
    #84cdc4 100%
  );
  border-bottom: 0 solid ${eenewsColors.accent};
  box-shadow: 0 8px 24px rgba(25, 90, 125, 0);
  transition:
    max-height 0.4s cubic-bezier(0.22, 0.61, 0.36, 1),
    opacity 0.25s ease,
    padding 0.4s cubic-bezier(0.22, 0.61, 0.36, 1),
    border-bottom-width 0.4s cubic-bezier(0.22, 0.61, 0.36, 1),
    box-shadow 0.3s ease;

  ${({ isOpen }) =>
    isOpen &&
    css`
      max-height: 700px;
      opacity: 1;
      padding: 28px 0 36px;
      border-bottom: 1.5px solid ${eenewsColors.accent};
      box-shadow: 0 28px 28px -12px rgba(25, 90, 125, 0.16);
    `}

  ${({ theme }) => theme.breakpoints.down('md')} {
    ${({ isOpen }) =>
      isOpen &&
      css`
        padding: 24px 0 32px;
      `}
  }
`;

const MegaGrid = styled('div')`
  max-width: 1340px;
  margin: 0 auto;
  padding: 0 56px;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr 1.2fr;
  gap: 32px 56px;
  align-items: start;

  ${({ theme }) => theme.breakpoints.down('lg')} {
    grid-template-columns: 1fr 1fr;
    gap: 24px 32px;
  }
  ${({ theme }) => theme.breakpoints.down('md')} {
    padding: 0 20px;
  }
  ${({ theme }) => theme.breakpoints.down('sm')} {
    grid-template-columns: 1fr;
  }
`;

const Dossiers2Col = styled('div')`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 32px;

  ${({ theme }) => theme.breakpoints.down('lg')} {
    grid-template-columns: 1fr;
  }
`;

const ColHeading = styled(Typography)`
  margin: 0 0 8px;
  color: ${eenewsColors.accent};
`;

const ColList = styled('ul')`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const ColItem = styled('li')`
  line-height: 42px;
`;

const ColLink = styled(Link)`
  color: ${eenewsColors.accent};
  text-decoration: none;
  transition: opacity 120ms ease;
  &:hover {
    opacity: 0.65;
    text-decoration: underline;
  }
`;

const SecondaryFoot = styled('div')`
  margin-top: 12px;
`;

export type EenewsMegaMenuProps = {
  isOpen: boolean;
  data: NavigationListQuery | undefined;
  categorySlugs: string[][];
};

export const EenewsMegaMenu = ({
  isOpen,
  data,
  categorySlugs,
}: EenewsMegaMenuProps) => {
  const shelf = categorySlugs[0] ?? [];
  const themen = findNavBySlug(data, shelf[0] ?? '');
  const dossiers = findNavBySlug(data, shelf[1] ?? '');
  const region = findNavBySlug(data, shelf[2] ?? '');
  const about = findNavBySlug(data, shelf[3] ?? '');
  const aboutSecondary = findNavBySlug(data, shelf[4] ?? '');

  const dossierLinks = dossiers?.links ?? [];
  const halfIdx = Math.ceil(dossierLinks.length / 2);
  const dossiersLeft = dossierLinks.slice(0, halfIdx);
  const dossiersRight = dossierLinks.slice(halfIdx);

  const renderList = (
    nav: FullNavigationFragment | undefined,
    fontSize?: 'sm'
  ) =>
    nav?.links.map((link, idx) => {
      const url = navigationLinkToUrl(link);
      if (!url) {
        return null;
      }
      return (
        <ColItem key={`${link.label}-${idx}`}>
          <ColLink href={url}>
            <Typography
              variant={fontSize === 'sm' ? 'megaItemSecondary' : 'megaItem'}
              component="span"
            >
              {link.label}
            </Typography>
          </ColLink>
        </ColItem>
      );
    });

  return (
    <MegaOverlay
      isOpen={isOpen}
      aria-hidden={!isOpen}
    >
      <MegaGrid>
        {themen && (
          <div>
            <ColHeading variant="megaCol">{themen.name || 'Themen'}</ColHeading>
            <ColList>{renderList(themen)}</ColList>
          </div>
        )}

        {dossiers && (
          <div>
            <ColHeading variant="megaCol">
              {dossiers.name || 'Dossiers'}
            </ColHeading>
            <Dossiers2Col>
              <ColList>
                {dossiersLeft.map((link, idx) => {
                  const url = navigationLinkToUrl(link);
                  if (!url) {
                    return null;
                  }
                  return (
                    <ColItem key={`${link.label}-${idx}`}>
                      <ColLink href={url}>
                        <Typography
                          variant="megaItem"
                          component="span"
                        >
                          {link.label}
                        </Typography>
                      </ColLink>
                    </ColItem>
                  );
                })}
              </ColList>
              <ColList>
                {dossiersRight.map((link, idx) => {
                  const url = navigationLinkToUrl(link);
                  if (!url) {
                    return null;
                  }
                  return (
                    <ColItem key={`${link.label}-${idx}`}>
                      <ColLink href={url}>
                        <Typography
                          variant="megaItem"
                          component="span"
                        >
                          {link.label}
                        </Typography>
                      </ColLink>
                    </ColItem>
                  );
                })}
              </ColList>
            </Dossiers2Col>
          </div>
        )}

        {region && (
          <div>
            <ColHeading variant="megaCol">{region.name || 'Region'}</ColHeading>
            <ColList>{renderList(region)}</ColList>
          </div>
        )}

        {(about || aboutSecondary) && (
          <div>
            {about && (
              <>
                <ColHeading variant="megaCol">
                  {about.name || 'ee-news'}
                </ColHeading>
                <ColList>{renderList(about)}</ColList>
              </>
            )}
            {aboutSecondary && (
              <SecondaryFoot>
                <ColList>{renderList(aboutSecondary, 'sm')}</ColList>
              </SecondaryFoot>
            )}
          </div>
        )}
      </MegaGrid>
    </MegaOverlay>
  );
};
