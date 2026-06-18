import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { InvoiceListContainer } from '@wepublish/membership/website';
import {
  FullInvoiceFragment,
  ProductType,
  useInvoicesQuery,
  useSubscriptionsQuery,
} from '@wepublish/website/api';
import { Link } from '@wepublish/website/builder';
import { useRouter } from 'next/router';
import { MdChevronLeft } from 'react-icons/md';

import {
  ProfileCard,
  ProfileCardBody,
  ProfileCardHead,
  ProfileCardTitle,
} from './eenews-profile-card';

const Page = styled('div')`
  max-width: 880px;
  width: 100%;
  margin: 0 auto;
  display: grid;
  gap: 24px;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: ${({ theme }) => theme.palette.primary.main};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const Header = styled('div')`
  display: grid;
  gap: 10px;
`;

const Eyebrow = styled('div')`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
`;

const Title = styled(Typography)`
  display: block;
  margin: 0;
  color: ${({ theme }) => theme.palette.primary.main};
`;

const Lead = styled(Typography)`
  display: block;
  color: ${({ theme }) => theme.palette.text.secondary};
  max-width: 60ch;
`;

type Tone = 'active' | 'due' | 'cancelled';

const TONES: Record<Tone, { bg: string; fg: string }> = {
  active: { bg: '#baf09c', fg: '#195a7d' },
  due: { bg: '#f8e0db', fg: '#8a2010' },
  cancelled: { bg: '#eef1f0', fg: '#5b6770' },
};

const StatusPill = styled('span', {
  shouldForwardProp: p => p !== 'tone',
})<{ tone: Tone }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 999px;
  background: ${({ tone }) => TONES[tone].bg};
  color: ${({ tone }) => TONES[tone].fg};
`;

const Dot = styled('span')`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
`;

const MetaGrid = styled('div')`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px 32px;
  ${({ theme }) => theme.breakpoints.down('sm')} {
    grid-template-columns: 1fr;
  }
`;

const MetaBlock = styled('div')`
  display: grid;
  gap: 3px;
`;

const MetaLabel = styled(Typography)`
  display: block;
  color: ${({ theme }) => theme.palette.text.secondary};
`;

const MetaValue = styled(Typography)`
  display: block;
  color: ${({ theme }) => theme.palette.primary.main};
`;

const InvoiceBody = styled(ProfileCardBody)`
  & article {
    gap: 0;
  }
`;

const isUnpaid = (invoice: FullInvoiceFragment): boolean =>
  !invoice.canceledAt && !invoice.paidAt;

const formatDate = (raw: string | null | undefined): string => {
  if (!raw) {
    return '–';
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    return '–';
  }
  return d.toLocaleDateString('de-CH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const EenewsSubscriptionDetail = () => {
  const router = useRouter();
  const id = router.query.id as string | undefined;

  const { data } = useSubscriptionsQuery({ fetchPolicy: 'cache-only' });
  const subscription = data?.userSubscriptions.find(sub => sub.id === id);

  const { data: invoiceData } = useInvoicesQuery();
  const hasUnpaid = (invoiceData?.userInvoices ?? []).some(
    invoice => invoice.subscriptionID === id && isUnpaid(invoice)
  );

  if (!subscription) {
    return null;
  }

  const isDonation =
    subscription.memberPlan.productType === ProductType.Donation;
  const typeLabel = isDonation ? 'Spende' : 'Mitgliedschaft';
  const amount = (subscription.monthlyAmount / 100).toFixed(2);

  const tone: Tone =
    subscription.deactivation ? 'cancelled'
    : hasUnpaid ? 'due'
    : 'active';
  const statusLabel =
    subscription.deactivation ? 'Gekündigt'
    : hasUnpaid ? 'Zahlung offen'
    : 'Aktiv';

  return (
    <Page>
      <BackLink href="/profile">
        <MdChevronLeft size={18} />
        <Typography
          variant="pageCrumb"
          component="span"
        >
          Mein Konto
        </Typography>
      </BackLink>

      <Header>
        <Eyebrow>
          <Typography
            variant="pageEyebrow"
            component="span"
          >
            {typeLabel} · {subscription.paymentPeriodicity}
          </Typography>
          <StatusPill tone={tone}>
            <Dot />
            <Typography
              variant="teaserBadge"
              component="span"
            >
              {statusLabel}
            </Typography>
          </StatusPill>
        </Eyebrow>
        <Title variant="sectionTitle">{subscription.memberPlan.name}</Title>
        <Lead variant="articleLeadTop">
          {typeLabel} seit {formatDate(subscription.startsAt)} · CHF {amount} /
          Monat.
        </Lead>
      </Header>

      <ProfileCard>
        <ProfileCardHead>
          <ProfileCardTitle
            variant="articleH2"
            component="h2"
          >
            Details
          </ProfileCardTitle>
        </ProfileCardHead>
        <ProfileCardBody>
          <MetaGrid>
            <MetaBlock>
              <MetaLabel variant="inputLabel">Plan</MetaLabel>
              <MetaValue variant="teaserMeta">
                {subscription.memberPlan.name}
              </MetaValue>
            </MetaBlock>
            <MetaBlock>
              <MetaLabel variant="inputLabel">Betrag</MetaLabel>
              <MetaValue variant="teaserMeta">CHF {amount} / Monat</MetaValue>
            </MetaBlock>
            <MetaBlock>
              <MetaLabel variant="inputLabel">Periodizität</MetaLabel>
              <MetaValue variant="teaserMeta">
                {subscription.paymentPeriodicity}
              </MetaValue>
            </MetaBlock>
            <MetaBlock>
              <MetaLabel variant="inputLabel">Zahlart</MetaLabel>
              <MetaValue variant="teaserMeta">
                {subscription.paymentMethod.name}
              </MetaValue>
            </MetaBlock>
            <MetaBlock>
              <MetaLabel variant="inputLabel">Auto-Verlängerung</MetaLabel>
              <MetaValue variant="teaserMeta">
                {subscription.autoRenew ? 'Aktiv' : 'Inaktiv'}
              </MetaValue>
            </MetaBlock>
            <MetaBlock>
              <MetaLabel variant="inputLabel">Nächste Zahlung</MetaLabel>
              <MetaValue variant="teaserMeta">
                {formatDate(subscription.paidUntil)}
              </MetaValue>
            </MetaBlock>
            <MetaBlock>
              <MetaLabel variant="inputLabel">{typeLabel} seit</MetaLabel>
              <MetaValue variant="teaserMeta">
                {formatDate(subscription.startsAt)}
              </MetaValue>
            </MetaBlock>
            <MetaBlock>
              <MetaLabel variant="inputLabel">Status</MetaLabel>
              <MetaValue variant="teaserMeta">{statusLabel}</MetaValue>
            </MetaBlock>
          </MetaGrid>
        </ProfileCardBody>
      </ProfileCard>

      <ProfileCard>
        <ProfileCardHead>
          <ProfileCardTitle
            variant="articleH2"
            component="h2"
          >
            Rechnungsverlauf
          </ProfileCardTitle>
        </ProfileCardHead>
        <InvoiceBody tight>
          <InvoiceListContainer
            filter={invoices =>
              invoices.filter(invoice => invoice.subscriptionID === id)
            }
          />
        </InvoiceBody>
      </ProfileCard>
    </Page>
  );
};
