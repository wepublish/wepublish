import styled from '@emotion/styled';
import { Button, Typography } from '@mui/material';
import { BuilderInvoiceListItemProps } from '@wepublish/website/builder';

import { eenewsColors } from '../theme';

const Row = styled('div')`
  display: grid;
  grid-template-columns: 110px 1fr 130px 100px auto;
  gap: 16px;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid ${eenewsColors.line};
  &:last-child {
    border-bottom: 0;
  }
  ${({ theme }) => theme.breakpoints.down('md')} {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
`;

const Nr = styled(Typography)`
  display: block;
  color: ${eenewsColors.accent};
`;

const Desc = styled(Typography)`
  display: block;
  color: ${eenewsColors.text};
`;

const Date = styled(Typography)`
  display: block;
  color: ${eenewsColors.muted};
`;

const Amount = styled(Typography)`
  display: block;
  color: ${eenewsColors.accent};
  text-align: right;
  ${({ theme }) => theme.breakpoints.down('md')} {
    text-align: left;
  }
`;

const formatDateDE = (raw: string | null | undefined): string => {
  if (!raw) {
    return '';
  }
  const d = new window.Date(raw);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  return d.toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
};

export const EenewsInvoiceListItem = ({
  className,
  id,
  description,
  dueAt,
  total,
  canPay,
  pay,
}: BuilderInvoiceListItemProps) => {
  const chf = (total / 100).toFixed(2);
  return (
    <Row className={className}>
      <Nr variant="teaserMeta">{id.slice(0, 8)}</Nr>
      <Desc variant="teaserMeta">{description ?? 'Mitgliedschaft'}</Desc>
      <Date variant="teaserMeta">Fällig: {formatDateDE(dueAt)}</Date>
      <Amount variant="articleH2">CHF {chf}</Amount>
      {canPay && pay && (
        <Button
          variant={'ee-alert' as any}
          size="small"
          onClick={() => pay()}
        >
          Bezahlen →
        </Button>
      )}
    </Row>
  );
};
