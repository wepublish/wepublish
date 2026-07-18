import styled from '@emotion/styled';
import {
  MemberPlan,
  MutationCreateVoucherArgs,
  MutationUpdateVoucherArgs,
} from '@wepublish/editor/api';
import { DateTimePicker, SelectMemberPlan } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { Form, NumberInput, Panel } from 'rsuite';

type VoucherFormData = (
  | MutationCreateVoucherArgs
  | MutationUpdateVoucherArgs
) & {
  memberPlan?: Pick<MemberPlan, 'id' | 'name'>;
};

type VoucherFormProps = {
  create?: boolean;
  voucher: Partial<VoucherFormData>;
  onChange: (changes: Partial<VoucherFormData>) => void;
};

const VoucherFormWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  align-items: start;
  gap: 12px;

  ${({ theme }) => theme.breakpoints.up('lg')} {
    grid-template-columns: 1fr 1fr;
  }
`;

const VoucherFormSection = styled.div`
  display: grid;
  align-items: start;
  gap: 12px;
`;

const CodeDiscountGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 100px;
  gap: 12px;
`;

const DateRangeGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

export const VoucherForm = ({
  voucher,
  onChange,
  create,
}: VoucherFormProps) => {
  const { t } = useTranslation();

  return (
    <VoucherFormWrapper>
      <VoucherFormSection>
        <Panel
          bordered
          css={{ overflow: 'initial' }}
        >
          <CodeDiscountGrid>
            <Form.Group controlId="code">
              <Form.Label>{t('voucher.form.code')}</Form.Label>

              <Form.Control
                name="code"
                value={(voucher.code ?? '').toUpperCase()}
                onChange={(code: string) => onChange({ code })}
              />
            </Form.Group>

            <Form.Group controlId="discountPercent">
              <Form.Label>{t('voucher.form.discountPercent')}</Form.Label>

              <Form.Control
                name="discountPercent"
                value={voucher.discountPercent ?? 0}
                onChange={(discountPercent: string) =>
                  onChange({ discountPercent: +discountPercent })
                }
                accepter={NumberInput}
              />
            </Form.Group>
          </CodeDiscountGrid>
        </Panel>
      </VoucherFormSection>

      <VoucherFormSection>
        <Panel
          bordered
          css={{ overflow: 'initial' }}
        >
          <Form.Group>
            <Form.Label>{t('voucher.form.memberPlan')}</Form.Label>

            <Form.Control
              name="memberPlan"
              defaultMemberPlan={voucher.memberPlan}
              selectedMemberPlan={voucher.memberPlanId}
              setSelectedMemberPlan={(memberPlanId: string) =>
                onChange({ memberPlanId })
              }
              accepter={SelectMemberPlan}
            />
          </Form.Group>

          <DateRangeGrid>
            <Form.Group controlId="validFrom">
              <Form.Control
                name="validFrom"
                label={t('voucher.form.validFrom')}
                dateTime={
                  voucher.validFrom ? new Date(voucher.validFrom) : undefined
                }
                changeDate={(date: Date) =>
                  onChange({ validFrom: date?.toISOString() })
                }
                accepter={DateTimePicker}
              />
            </Form.Group>

            <Form.Group controlId="validTo">
              <Form.Control
                name="validTo"
                label={t('voucher.form.validTo')}
                dateTime={
                  voucher.validTo ? new Date(voucher.validTo) : undefined
                }
                changeDate={(date: Date) =>
                  onChange({ validTo: date?.toISOString() })
                }
                accepter={DateTimePicker}
              />
            </Form.Group>
          </DateRangeGrid>
        </Panel>
      </VoucherFormSection>
    </VoucherFormWrapper>
  );
};
