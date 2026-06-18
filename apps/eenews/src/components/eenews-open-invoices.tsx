import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { InvoiceListContainer } from '@wepublish/membership/website';
import { FullInvoiceFragment, useInvoicesQuery } from '@wepublish/website/api';
import { Link } from '@wepublish/website/builder';
import { MdChevronLeft } from 'react-icons/md';

import {
  ProfileCard,
  ProfileCardAside,
  ProfileCardBody,
  ProfileCardHead,
  ProfileCardTitle,
} from './eenews-profile-card';

const isUnpaid = (invoice: FullInvoiceFragment): boolean =>
  Boolean(invoice.subscription) && !invoice.canceledAt && !invoice.paidAt;

const Count = styled('span')`
  opacity: 0.85;
`;

const InvoiceBody = styled(ProfileCardBody)`
  & article {
    gap: 0;
  }
`;

const formatDeadline = (raw: string | null | undefined): string => {
  if (!raw) {
    return '';
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  return d.toLocaleDateString('de-CH', { day: 'numeric', month: 'long' });
};

export const OpenInvoicesCard = () => {
  const { data, loading } = useInvoicesQuery();
  const unpaid = (data?.userInvoices ?? []).filter(isUnpaid);

  if (!loading && unpaid.length === 0) {
    return null;
  }

  const earliestDue = unpaid
    .map(invoice => invoice.dueAt)
    .filter((due): due is string => Boolean(due))
    .sort()[0];

  return (
    <ProfileCard alert>
      <ProfileCardHead alert>
        <ProfileCardTitle
          alert
          variant="articleH2"
          component="h2"
        >
          Offene Rechnungen
          {unpaid.length > 0 && (
            <Count>
              <Typography
                variant="pageCrumb"
                component="span"
              >
                {unpaid.length} offen
              </Typography>
            </Count>
          )}
        </ProfileCardTitle>
        {earliestDue && (
          <ProfileCardAside
            alert
            variant="teaserMeta"
          >
            Bitte begleichen bis {formatDeadline(earliestDue)}
          </ProfileCardAside>
        )}
      </ProfileCardHead>
      <InvoiceBody tight>
        <InvoiceListContainer filter={invoices => invoices.filter(isUnpaid)} />
      </InvoiceBody>
    </ProfileCard>
  );
};

const Page = styled('div')`
  max-width: 880px;
  width: 100%;
  margin: 0 auto;
  display: grid;
  gap: 20px;
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

const ClearText = styled(Typography)`
  color: ${({ theme }) => theme.palette.text.secondary};
`;

export const EenewsOpenInvoices = () => {
  const { data, loading } = useInvoicesQuery();
  const unpaid = (data?.userInvoices ?? []).filter(isUnpaid);
  const allClear = !loading && unpaid.length === 0;

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

      {allClear ?
        <ProfileCard>
          <ProfileCardHead>
            <ProfileCardTitle
              variant="articleH2"
              component="h1"
            >
              Offene Rechnungen
            </ProfileCardTitle>
          </ProfileCardHead>
          <ProfileCardBody>
            <ClearText variant="teaserExcerpt">
              Sie haben aktuell keine offenen Rechnungen. Vielen Dank für Ihre
              Unterstützung.
            </ClearText>
          </ProfileCardBody>
        </ProfileCard>
      : <OpenInvoicesCard />}
    </Page>
  );
};
