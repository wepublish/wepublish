import styled from '@emotion/styled';
import { css, GlobalStyles, Typography } from '@mui/material';
import { useSetIntendedRoute } from '@wepublish/authentication/website';
import { Button } from '@wepublish/ui';
import { BannerAction, BannerActionRole } from '@wepublish/website/api';
import {
  BuilderBannerProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { differenceInHours } from 'date-fns';
import { useEffect, useState } from 'react';
import { BANNER_STORAGE_KEY, collapseBanner } from './collapse-banner';

export const BannerImage = styled('div')(
  ({ theme }) => `
  background-size: cover;
  background-position: center;
  height: ${theme.spacing(18)};
  order: 1;
  ${theme.breakpoints.up('md')} {
    order: 0;
    height: unset;
  }
`
);

export const BannerContentWrapper = styled('div')`
  padding: ${({ theme }) => theme.spacing(4)};
  padding-top: ${({ theme }) => theme.spacing(5)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding: ${({ theme }) => theme.spacing(9)};
  }
`;

export const BannerContent = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
`;

export const BannerCta = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
`;

export const BannerCtaText = styled('p')`
  text-align: center;
`;

export const BannerCloseButton = styled('span')`
  position: absolute;
  top: ${({ theme }) => theme.spacing(1)};
  right: ${({ theme }) => theme.spacing(1)};
  cursor: pointer;
  font-size: 2rem;
  width: 2rem;
  height: 2rem;
  line-height: 2rem;

  ${({ theme }) => theme.breakpoints.up('md')} {
    top: ${({ theme }) => theme.spacing(4)};
    right: ${({ theme }) => theme.spacing(4)};
  }
`;

export const BannerTitle = styled('div')`
  padding-right: ${({ theme }) => theme.spacing(3)};
`;
export const BannerText = styled('div')``;

export const BannerActions = styled('div')`
  display: flex;
  gap: ${({ theme }) => theme.spacing(3)};
  justify-content: center;
`;

type BannerWrapperProps = {
  hasImage?: boolean;
};

export const BannerWrapper = styled('div')<BannerWrapperProps>(
  ({ theme, hasImage }) => `
  z-index: 11;
  position: sticky;
  top: var(--navbar-height);
  display: grid;
  grid-template-columns: 1fr;
  background-color: ${theme.palette.secondary.main};
  color: ${theme.palette.secondary.contrastText};

  &[data-collapsed='true'] {
    display: none;
  }

  ${theme.breakpoints.up('md')} {
    grid-template-columns: ${hasImage ? 'minmax(auto, 50%) 1fr' : '1fr'};
  }
`
);

export const Banner = ({
  data,
  loading,
  error,
  className,
}: BuilderBannerProps) => {
  const [showBanner, setShowBanner] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const {
    elements: { Link },
  } = useWebsiteBuilder();
  const setIntendedRoute = useSetIntendedRoute();

  useEffect(() => {
    if (!data?.primaryBanner) {
      return;
    }

    const timer = setTimeout(
      () => setShowBanner(true),
      (data?.primaryBanner?.delay ?? 0) * 1000
    );

    return () => clearTimeout(timer);
  }, [data?.primaryBanner]);

  useEffect(() => {
    const lastClosedTime =
      Number(localStorage.getItem(BANNER_STORAGE_KEY)) ?? 0;
    const currentTime = new Date().getTime();

    const isClosedRecently =
      differenceInHours(currentTime, lastClosedTime) < 24;

    setCollapsed(isClosedRecently);
  }, [data]);

  const handleClose = () => {
    setCollapsed(true);
    collapseBanner();
  };

  const handleActionClick = (e: React.MouseEvent, action: BannerAction) => {
    if (action.role === BannerActionRole.Cancel) {
      e.preventDefault();
      handleClose();

      return;
    }

    setIntendedRoute();
  };

  if (!data?.primaryBanner || loading || error) {
    return <></>;
  }

  if (!showBanner) {
    return <></>;
  }

  const htmlContent = data?.primaryBanner?.html;

  return (
    <BannerWrapper
      hasImage={!!data?.primaryBanner.image}
      className={className}
      data-collapsed={collapsed}
      data-banner
    >
      <BannerCloseButton onClick={handleClose}>&#x2715;</BannerCloseButton>

      {data?.primaryBanner.image && (
        <BannerImage
          style={{ backgroundImage: `url(${data?.primaryBanner.image.url})` }}
        ></BannerImage>
      )}

      {htmlContent && (
        <BannerContentWrapper
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      )}

      {!htmlContent && (
        <BannerContentWrapper>
          <BannerContent>
            <Typography
              variant="bannerTitle"
              component={BannerTitle}
            >
              {data?.primaryBanner.title}
            </Typography>

            <Typography
              variant="bannerText"
              component={BannerText}
            >
              {data?.primaryBanner.text}
            </Typography>
          </BannerContent>

          <BannerCta>
            {data?.primaryBanner.cta && (
              <Typography
                variant="bannerCta"
                component={BannerCtaText}
              >
                {data?.primaryBanner.cta}
              </Typography>
            )}

            <BannerActions>
              {data?.primaryBanner.actions?.map(a => (
                <Button
                  color={
                    a.role === BannerActionRole.Primary ?
                      'primary'
                    : 'secondary'
                  }
                  data-role={a.role}
                  LinkComponent={Link}
                  href={a.url}
                  key={a.url}
                  onClick={e => handleActionClick(e, a)}
                >
                  {a.label}
                </Button>
              ))}
            </BannerActions>
          </BannerCta>
        </BannerContentWrapper>
      )}
    </BannerWrapper>
  );
};

export const forceHideBanner = (
  <GlobalStyles
    styles={css`
      [data-banner] {
        display: none !important;
      }
    `}
  />
);
