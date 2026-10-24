import styled from '@emotion/styled';
import { Skeleton } from '@mui/material';
import {
  Currency,
  FullGiftCodeFragment,
  GiftCodeStatus,
} from '@wepublish/website/api';
import {
  BuilderGiftCodeListProps,
  useAsyncAction,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAttachMoney,
  MdCalendarMonth,
  MdContentCopy,
  MdOutlineCardGiftcard,
  MdPerson,
} from 'react-icons/md';
import { formatCurrency } from '../formatters/format-currency';

export const GiftCodeListWrapper = styled('section')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
`;

export const GiftCodeListItemWrapper = styled('article')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(2)};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  border: 1px solid ${({ theme }) => theme.palette.divider};
`;

export const GiftCodeListItemMeta = styled('ul')`
  list-style: none;
  margin: 0;
  padding: 0;
`;

export const GiftCodeListItemMetaItem = styled('li')`
  display: grid;
  grid-auto-flow: column;
  align-items: center;
  justify-content: start;
  gap: ${({ theme }) => theme.spacing(1)};
`;

export const GiftCodeListItemCode = styled('div')`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(2)};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background-color: ${({ theme }) => theme.palette.grey[100]};
`;

export const GiftCodeListItemCodeValue = styled('code')`
  font-size: 1.25em;
  font-weight: 700;
  letter-spacing: 0.1em;
`;

export const GiftCodeListItemActions = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
`;

export const canPayGiftCode = ({ paid, status }: FullGiftCodeFragment) =>
  !paid &&
  (status === GiftCodeStatus.Ordered || status === GiftCodeStatus.Issued);

type GiftCodeListItemProps = FullGiftCodeFragment & {
  className?: string;
  onPay?: (giftCodeId: string, paymentMethodId: string) => Promise<void>;
};

export function GiftCodeListItem({
  className,
  onPay,
  ...giftCode
}: GiftCodeListItemProps) {
  const {
    meta: { locale },
    elements: { Alert, Button, H6 },
    PaymentMethodPicker,
    date,
  } = useWebsiteBuilder();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const [copied, setCopied] = useState(false);
  const [paymentMethodId, setPaymentMethodId] = useState(
    giftCode.offer.paymentMethods[0]?.id
  );
  const callAction = useAsyncAction(setLoading, setError);

  const canPay = canPayGiftCode(giftCode) && !!paymentMethodId;
  const showCode = giftCode.status === GiftCodeStatus.Issued && !!giftCode.code;

  const copyCode = async () => {
    if (!giftCode.code || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(giftCode.code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <GiftCodeListItemWrapper className={className}>
      <H6 component="h3">{giftCode.offer.name}</H6>

      <strong>
        {t(`giftCode.status.${giftCode.status}`)}
        {giftCode.status === GiftCodeStatus.Issued &&
          !giftCode.paid &&
          ` · ${t('giftCode.list.unpaid')}`}
      </strong>

      {showCode && (
        <GiftCodeListItemCode>
          <span>{t('giftCode.list.code')}</span>

          <GiftCodeListItemCodeValue data-sentry-mask>
            {giftCode.code}
          </GiftCodeListItemCodeValue>

          <Button
            variant="outlined"
            size="small"
            startIcon={<MdContentCopy />}
            onClick={copyCode}
          >
            {copied ? t('giftCode.list.copied') : t('giftCode.list.copy')}
          </Button>
        </GiftCodeListItemCode>
      )}

      <GiftCodeListItemMeta>
        <GiftCodeListItemMetaItem>
          <MdPerson />
          <span data-sentry-mask>
            {t('giftCode.list.recipient')} {giftCode.recipientName}
          </span>
        </GiftCodeListItemMetaItem>

        <GiftCodeListItemMetaItem>
          <MdOutlineCardGiftcard />
          <span>
            {giftCode.memberPlan.name},{' '}
            {t('giftCode.duration', { periodicity: giftCode.periodicity })}
          </span>
        </GiftCodeListItemMetaItem>

        <GiftCodeListItemMetaItem>
          <MdAttachMoney />
          <span>
            {t('giftCode.list.amount')}{' '}
            {formatCurrency(
              giftCode.amount / 100,
              giftCode.currency ?? Currency.Chf,
              locale
            )}
          </span>
        </GiftCodeListItemMetaItem>

        <GiftCodeListItemMetaItem>
          <MdCalendarMonth />
          <span>
            {t('giftCode.list.createdAt')}{' '}
            <time
              suppressHydrationWarning
              dateTime={giftCode.createdAt}
            >
              {date.format(new Date(giftCode.createdAt))}
            </time>
          </span>
        </GiftCodeListItemMetaItem>

        {giftCode.expiresAt && giftCode.status === GiftCodeStatus.Issued && (
          <GiftCodeListItemMetaItem>
            <MdCalendarMonth />
            <span>
              {t('giftCode.list.expiresAt')}{' '}
              <time
                suppressHydrationWarning
                dateTime={giftCode.expiresAt}
              >
                {date.format(new Date(giftCode.expiresAt))}
              </time>
            </span>
          </GiftCodeListItemMetaItem>
        )}

        {giftCode.redeemedAt && (
          <GiftCodeListItemMetaItem>
            <MdCalendarMonth />
            <span>
              {t('giftCode.list.redeemedAt')}{' '}
              <time
                suppressHydrationWarning
                dateTime={giftCode.redeemedAt}
              >
                {date.format(new Date(giftCode.redeemedAt))}
              </time>
            </span>
          </GiftCodeListItemMetaItem>
        )}

        {giftCode.canceledAt && (
          <GiftCodeListItemMetaItem>
            <MdCalendarMonth />
            <span>
              {t('giftCode.list.canceledAt')}{' '}
              <time
                suppressHydrationWarning
                dateTime={giftCode.canceledAt}
              >
                {date.format(new Date(giftCode.canceledAt))}
              </time>
            </span>
          </GiftCodeListItemMetaItem>
        )}
      </GiftCodeListItemMeta>

      {giftCode.status === GiftCodeStatus.Ordered && (
        <Alert severity="info">{t('giftCode.list.orderedNote')}</Alert>
      )}

      {canPayGiftCode(giftCode) && !giftCode.offer.paymentMethods.length && (
        <Alert severity="warning">
          {t('giftCode.purchase.noPaymentMethods')}
        </Alert>
      )}

      {error && <Alert severity="error">{error.message}</Alert>}

      {canPay && (
        <GiftCodeListItemActions>
          {giftCode.offer.paymentMethods.length > 1 && (
            <PaymentMethodPicker
              paymentMethods={giftCode.offer.paymentMethods}
              value={paymentMethodId}
              onChange={setPaymentMethodId}
            />
          )}

          <Button
            disabled={loading}
            onClick={() =>
              callAction(onPay)(giftCode.id, paymentMethodId as string)
            }
          >
            {t('giftCode.list.pay')}
          </Button>
        </GiftCodeListItemActions>
      )}
    </GiftCodeListItemWrapper>
  );
}

export const GiftCodeList = ({
  data,
  loading,
  onPay,
  className,
}: BuilderGiftCodeListProps) => {
  const {
    elements: { H4 },
  } = useWebsiteBuilder();
  const { t } = useTranslation();
  const giftCodes = data?.myGiftCodes ?? [];

  if (!giftCodes.length) {
    return loading ? <Skeleton variant={'rectangular'} /> : null;
  }

  return (
    <GiftCodeListWrapper className={className}>
      <H4 component={'h2'}>{t('giftCode.list.title')}</H4>

      {giftCodes.map(giftCode => (
        <GiftCodeListItem
          key={giftCode.id}
          {...giftCode}
          onPay={onPay}
        />
      ))}
    </GiftCodeListWrapper>
  );
};
