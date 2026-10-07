import styled from '@emotion/styled';
import {
  DeactivationFragment,
  PaymentPeriodicity,
} from '@wepublish/editor/api';
import { PAYMENT_PERIODICITY_MONTHS } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { Button, Modal } from 'rsuite';

const Intro = styled.p`
  margin-bottom: 20px;
`;

const Summary = styled.div`
  border: 1px solid var(--rs-border-primary, #e5e5ea);
  border-radius: 6px;
  overflow: hidden;
`;

const SummaryHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  background-color: var(--rs-bg-well, #f7f7fa);
  border-bottom: 1px solid var(--rs-border-primary, #e5e5ea);
`;

const MemberPlanName = styled.span`
  font-size: 15px;
  font-weight: 600;
`;

const Amount = styled.span`
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
`;

const Facts = styled.dl`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px 16px;
  margin: 0;
  padding: 14px 16px;
  font-size: 13px;
`;

const FactLabel = styled.dt`
  color: var(--rs-text-secondary, #8e8e93);
  font-weight: 400;
`;

const FactValue = styled.dd`
  margin: 0;
  text-align: right;
`;

const Deactivation = styled.div`
  display: grid;
  gap: 4px;
  padding: 12px 16px;
  border-top: 1px solid var(--rs-border-primary, #e5e5ea);
  background-color: var(--rs-message-error-bg, #fff2f2);
  font-size: 13px;
`;

const DeactivationDate = styled.span`
  font-weight: 600;
`;

const DeactivationHint = styled.span`
  color: var(--rs-text-secondary, #8e8e93);
`;

export interface ReactivateSubscriptionModalProps {
  open: boolean;
  loading?: boolean;
  userName?: string | null;
  memberPlanName?: string;
  monthlyAmount?: number;
  paymentPeriodicity?: PaymentPeriodicity;
  currency?: string;
  paidUntil?: Date | null;
  deactivation?: DeactivationFragment | null;
  onConfirm(): void;
  onClose(): void;
}

function capitalizeFirstLetter(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function ReactivateSubscriptionModal({
  open,
  loading,
  userName,
  memberPlanName,
  monthlyAmount,
  paymentPeriodicity,
  currency,
  paidUntil,
  deactivation,
  onConfirm,
  onClose,
}: ReactivateSubscriptionModalProps) {
  const { t } = useTranslation();

  const periodAmount =
    monthlyAmount !== undefined && paymentPeriodicity ?
      (monthlyAmount * PAYMENT_PERIODICITY_MONTHS[paymentPeriodicity]) / 100
    : undefined;

  return (
    <Modal
      open={open}
      size="sm"
      backdrop="static"
      onClose={onClose}
    >
      <Modal.Header>
        <Modal.Title>
          {t('userSubscriptionEdit.reactivation.modalTitle')}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Intro>
          {t('userSubscriptionEdit.reactivation.modalMessage', {
            userName:
              userName || t('subscriptionList.panels.unknown').toString(),
          })}
        </Intro>

        <Summary>
          <SummaryHeader>
            <MemberPlanName>{memberPlanName}</MemberPlanName>

            {periodAmount !== undefined && (
              <Amount>{`${currency} ${periodAmount.toFixed(2)}`}</Amount>
            )}
          </SummaryHeader>

          <Facts>
            {paymentPeriodicity && (
              <>
                <FactLabel>
                  {t('memberPlanList.paymentPeriodicities')}
                </FactLabel>
                <FactValue>
                  {t(`memberPlanList.paymentPeriodicity.${paymentPeriodicity}`)}
                </FactValue>
              </>
            )}

            {paidUntil && (
              <>
                <FactLabel>{t('userSubscriptionEdit.paidUntil')}</FactLabel>
                <FactValue>
                  {t('userSubscriptionEdit.reactivation.date', {
                    date: paidUntil,
                  })}
                </FactValue>
              </>
            )}
          </Facts>

          {deactivation && (
            <Deactivation>
              <DeactivationDate>
                {t(
                  new Date(deactivation.date) < new Date() ?
                    'userSubscriptionEdit.reactivation.deactivatedSince'
                  : 'userSubscriptionEdit.reactivation.deactivatedOn',
                  {
                    date: new Date(deactivation.date),
                    reason: t(
                      `userSubscriptionEdit.deactivation.reason${capitalizeFirstLetter(
                        deactivation.reason
                      )}`
                    ),
                  }
                )}
              </DeactivationDate>

              <DeactivationHint>
                {t('userSubscriptionEdit.reactivation.hint')}
              </DeactivationHint>
            </Deactivation>
          )}
        </Summary>
      </Modal.Body>

      <Modal.Footer>
        <Button
          appearance="primary"
          disabled={loading}
          loading={loading}
          onClick={onConfirm}
        >
          {t('userSubscriptionEdit.reactivation.confirm')}
        </Button>

        <Button
          appearance="subtle"
          onClick={onClose}
        >
          {t('cancel')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
