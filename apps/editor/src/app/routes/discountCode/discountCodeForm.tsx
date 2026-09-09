import styled from '@emotion/styled';
import {
  MemberPlan,
  MutationCreateDiscountCodeArgs,
  MutationUpdateDiscountCodeArgs,
} from '@wepublish/editor/api';
import { DateTimePicker, SelectMemberPlan } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { Form, NumberInput, Panel } from 'rsuite';

type DiscountCodeFormData = (
  | MutationCreateDiscountCodeArgs
  | MutationUpdateDiscountCodeArgs
) & {
  memberPlan?: Pick<MemberPlan, 'id' | 'name'>;
};

type DiscountCodeFormProps = {
  create?: boolean;
  discountCode: Partial<DiscountCodeFormData>;
  onChange: (changes: Partial<DiscountCodeFormData>) => void;
};

const DiscountCodeFormWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  align-items: start;
  gap: 12px;

  ${({ theme }) => theme.breakpoints.up('lg')} {
    grid-template-columns: 1fr 1fr;
  }
`;

const DiscountCodeFormSection = styled.div`
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

export const DiscountCodeForm = ({
  discountCode,
  onChange,
  create,
}: DiscountCodeFormProps) => {
  const { t } = useTranslation();

  return (
    <DiscountCodeFormWrapper>
      <DiscountCodeFormSection>
        <Panel
          bordered
          css={{ overflow: 'initial' }}
        >
          <CodeDiscountGrid>
            <Form.Group controlId="code">
              <Form.Label>{t('discountCode.form.code')}</Form.Label>

              <Form.Control
                name="code"
                value={(discountCode.code ?? '').toUpperCase()}
                onChange={(code: string) => onChange({ code })}
              />
            </Form.Group>

            <Form.Group controlId="discountPercent">
              <Form.Label>{t('discountCode.form.discountPercent')}</Form.Label>

              <Form.Control
                name="discountPercent"
                value={discountCode.discountPercent ?? 0}
                onChange={(discountPercent: string) =>
                  onChange({ discountPercent: +discountPercent })
                }
                accepter={NumberInput}
              />
            </Form.Group>
          </CodeDiscountGrid>
        </Panel>
      </DiscountCodeFormSection>

      <DiscountCodeFormSection>
        <Panel
          bordered
          css={{ overflow: 'initial' }}
        >
          <Form.Group>
            <Form.Label>{t('discountCode.form.memberPlan')}</Form.Label>

            <Form.Control
              name="memberPlan"
              defaultMemberPlan={discountCode.memberPlan}
              selectedMemberPlan={discountCode.memberPlanId}
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
                label={t('discountCode.form.validFrom')}
                dateTime={
                  discountCode.validFrom ?
                    new Date(discountCode.validFrom)
                  : undefined
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
                label={t('discountCode.form.validTo')}
                dateTime={
                  discountCode.validTo ?
                    new Date(discountCode.validTo)
                  : undefined
                }
                changeDate={(date: Date) =>
                  onChange({ validTo: date?.toISOString() })
                }
                accepter={DateTimePicker}
              />
            </Form.Group>
          </DateRangeGrid>
        </Panel>
      </DiscountCodeFormSection>
    </DiscountCodeFormWrapper>
  );
};
