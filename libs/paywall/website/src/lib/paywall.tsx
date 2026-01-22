import styled from '@emotion/styled';
import {
  BuilderPaywallProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useIntersectionObserver } from 'usehooks-ts';
import { forceHideBanner } from '@wepublish/banner/website';
import {
  useSetIntendedRoute,
  useUser,
} from '@wepublish/authentication/website';
import { useTranslation } from 'react-i18next';

export const PaywallWrapper = styled.div`
  display: grid !important; // exception as it should always be shown
  gap: ${({ theme }) => theme.spacing(5)};
  background-color: ${({ theme }) => theme.palette.accent.light};
  color: ${({ theme }) => theme.palette.accent.contrastText};
  padding: ${({ theme }) => theme.spacing(4)};
`;

const PaywallActions = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  column-gap: ${({ theme }) => theme.spacing(3)};
  row-gap: ${({ theme }) => theme.spacing(2)};

  ${({ theme }) => theme.breakpoints.up('sm')} {
    grid-template-columns: max-content max-content;
  }
`;

export const Paywall = ({
  className,
  description,
  circumventDescription,
  hideContent,
  alternativeSubscribeUrl,
  texts,
}: BuilderPaywallProps) => {
  const { t } = useTranslation();
  const { hasUser } = useUser();
  const {
    elements: { Button, Link },
    blocks: { RichText },
  } = useWebsiteBuilder();
  const { isIntersecting, ref } = useIntersectionObserver({
    initialIsIntersecting: false,
  });
  const setIntendedRoute = useSetIntendedRoute();

  return (
    <PaywallWrapper
      className={className}
      ref={ref}
    >
      <RichText
        richText={
          (hideContent ? description : (
            (circumventDescription ?? description)
          )) ?? []
        }
      />

      <PaywallActions>
        <Button
          variant="contained"
          color="secondary"
          LinkComponent={Link}
          href={alternativeSubscribeUrl || '/mitmachen'}
          onClick={setIntendedRoute}
        >
          {texts?.subscribe ?? t('paywall.subscribe')}
        </Button>

        {!hasUser && (
          <Button
            variant="outlined"
            color="secondary"
            LinkComponent={Link}
            href={'/login'}
            onClick={setIntendedRoute}
          >
            {texts?.login ?? t('paywall.login')}
          </Button>
        )}
      </PaywallActions>

      {isIntersecting && forceHideBanner}
    </PaywallWrapper>
  );
};
