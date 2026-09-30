import { useUser } from '@wepublish/authentication/website';
import { NewsletterListContainer } from '@wepublish/membership/website';
import {
  useConfirmNewsletterSubscriptionMutation,
  useMyNewsletterListsQuery,
} from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ContentWrapper } from '@wepublish/content/website';
import styled from '@emotion/styled';

export const ProfileNewsletterWrapper = styled(ContentWrapper)`
  gap: ${({ theme }) => theme.spacing(2)};
`;

export function ProfileNewsletter({ className }: { className?: string }) {
  const {
    elements: { H4, Alert, Paragraph },
  } = useWebsiteBuilder();
  const { t } = useTranslation();
  const { user } = useUser();
  const router = useRouter();
  const { data } = useMyNewsletterListsQuery();
  const [confirmNewsletter, { data: confirmData, error: confirmError }] =
    useConfirmNewsletterSubscriptionMutation();

  useEffect(() => {
    const token = router.query.confirmNewsletter as string | undefined;

    if (!token) {
      return;
    }

    const { confirmNewsletter: _, jwt: __, ...query } = router.query;
    const cleanUpUrl = () =>
      router.replace({ pathname: '/profile', query }, undefined, {
        shallow: true,
      });

    confirmNewsletter({ variables: { token } }).then(cleanUpUrl, cleanUpUrl);
  }, [router.query.confirmNewsletter, confirmNewsletter, router]);

  if (!data?.myNewsletterLists.length && !confirmData && !confirmError) {
    return null;
  }

  return (
    <ProfileNewsletterWrapper className={className}>
      {confirmData && (
        <Alert severity="success">{t('newsletter.confirmed')}</Alert>
      )}

      {confirmError && <Alert severity="error">{confirmError.message}</Alert>}

      {!!data?.myNewsletterLists.length && (
        <>
          <H4 component={'h1'}>{t('newsletter.title')}</H4>
          <Paragraph>
            {t('newsletter.intro')}
            {user?.email &&
              ` ${t('newsletter.recipient', { email: user.email })}`}
          </Paragraph>
          <NewsletterListContainer />
        </>
      )}
    </ProfileNewsletterWrapper>
  );
}
