import styled from '@emotion/styled';
import {
  FullMemberPlanFragment,
  MutationCreateDiscountCodeArgs,
  MutationUpdateDiscountCodeArgs,
} from '@wepublish/editor/api';
import {
  DateTimePicker,
  InfoTooltip,
  SelectMemberPlan,
} from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { Form, NumberInput, Panel } from 'rsuite';

type DiscountCodeFormData = (
  | MutationCreateDiscountCodeArgs
  | MutationUpdateDiscountCodeArgs
) & {
  memberPlan?: Pick<FullMemberPlanFragment, 'id' | 'name'>;
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
  gap: 16px;

  ${({ theme }) => theme.breakpoints.up('lg')} {
    grid-template-columns: 1fr 1fr;
  }
`;

const DiscountCodeFormSection = styled.div`
  display: grid;
  align-items: start;
  gap: 16px;
`;

const CodeDiscountGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(140px, 180px);
  align-self: stretch;
  gap: 16px;

  .rs-form-group {
    min-width: 0;
  }

  .rs-form-control,
  .rs-input-group {
    width: 100%;
  }

  @media (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const DateRangeGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-self: stretch;
  gap: 16px;
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
              <Form.Label>
                {t('discountCode.form.code')}{' '}
                <InfoTooltip text={t('discountCode.form.codeInfo')} />
              </Form.Label>

              <Form.Control
                name="code"
                value={(discountCode.code ?? '').toUpperCase()}
                onChange={(code: string) => onChange({ code })}
              />
            </Form.Group>

            <Form.Group controlId="discountPercent">
              <Form.Label>
                {t('discountCode.form.discountPercent')}{' '}
                <InfoTooltip
                  text={t('discountCode.form.discountPercentInfo')}
                />
              </Form.Label>

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
            <Form.Label>
              {t('discountCode.form.memberPlan')}{' '}
              <InfoTooltip text={t('discountCode.form.memberPlanInfo')} />
            </Form.Label>

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
