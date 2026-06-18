import styled from '@emotion/styled';
import { Button, Typography } from '@mui/material';
import { BuilderInvoiceListItemProps } from '@wepublish/website/builder';

const Row = styled('div')`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 20px;
  padding: 16px 0;
  border-bottom: 1px solid rgba(193, 54, 27, 0.18);
  &:last-child {
    border-bottom: 0;
  }
`;

const Nr = styled(Typography)`
  flex: 0 0 auto;
  color: ${({ theme }) => theme.palette.primary.main};
  font-variant-numeric: tabular-nums;
  opacity: 0.7;
`;

const Desc = styled(Typography)`
  flex: 1 1 200px;
  min-width: 0;
  color: ${({ theme }) => theme.palette.text.primary};
`;

const DueDate = styled(Typography)`
  flex: 0 0 auto;
  color: ${({ theme }) => theme.palette.text.secondary};
`;

const Amount = styled(Typography)`
  flex: 0 0 auto;
  font-size: 18px;
  font-weight: 800;
  color: ${({ theme }) => theme.palette.primary.main};
`;

const PayButton = styled(Button)`
  flex: 0 0 auto;
`;

const formatDateDE = (raw: string | null | undefined): string => {
  if (!raw) {
    return '';
  }
  const d = new Date(raw);
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
      <DueDate variant="teaserMeta">Fällig: {formatDateDE(dueAt)}</DueDate>
      <Amount variant="teaserMeta">CHF {chf}</Amount>
      {canPay && pay && (
        <PayButton
          variant={'ee-alert' as any}
          size="small"
          onClick={() => pay()}
        >
          Bezahlen →
        </PayButton>
      )}
    </Row>
  );
};
