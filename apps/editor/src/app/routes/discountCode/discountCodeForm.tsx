import styled from '@emotion/styled';
import {
  Box,
  Card,
  CardContent,
  FormControl,
  FormLabel,
  TextField,
} from '@mui/material';
import { FullMemberPlanFragment } from '@wepublish/editor/api';
import {
  DateTimePicker,
  InfoTooltip,
  SelectMemberPlan,
} from '@wepublish/ui/editor';
import { useId } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

export const discountCodeSchema = z
  .object({
    id: z.string().optional(),
    code: z.string().min(3),
    discountPercent: z.coerce.number().int().min(0).max(100),
    memberPlanId: z.string().min(1),
    memberPlan: z
      .custom<Pick<FullMemberPlanFragment, 'id' | 'name'>>()
      .optional(),
    validFrom: z.string().min(1),
    validTo: z.string().min(1),
  })
  .refine(value => new Date(value.validTo) >= new Date(value.validFrom), {
    path: ['validTo'],
  });

export type DiscountCodeFormValues = z.infer<typeof discountCodeSchema>;

type DiscountCodeFormProps = {
  create?: boolean;
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

export const DiscountCodeForm = ({ create }: DiscountCodeFormProps) => {
  const { t } = useTranslation();
  const { control } = useFormContext<DiscountCodeFormValues>();
  const memberPlan = useWatch({ control, name: 'memberPlan' });
  const memberPlanLabelId = useId();

  return (
    <DiscountCodeFormWrapper>
      <DiscountCodeFormSection>
        <Card
          variant="outlined"
          css={{ overflow: 'initial' }}
        >
          <CardContent>
            <CodeDiscountGrid>
              <Controller
                control={control}
                name="code"
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    value={(field.value ?? '').toUpperCase()}
                    label={
                      <>
                        {t('discountCode.form.code')}{' '}
                        <InfoTooltip text={t('discountCode.form.codeInfo')} />
                      </>
                    }
                    error={Boolean(error)}
                    helperText={error?.message}
                    fullWidth
                  />
                )}
              />

              <Controller
                control={control}
                name="discountPercent"
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    value={field.value ?? 0}
                    label={
                      <>
                        {t('discountCode.form.discountPercent')}{' '}
                        <InfoTooltip
                          text={t('discountCode.form.discountPercentInfo')}
                        />
                      </>
                    }
                    type="number"
                    onChange={event => field.onChange(+event.target.value)}
                    error={Boolean(error)}
                    helperText={error?.message}
                    fullWidth
                  />
                )}
              />
            </CodeDiscountGrid>
          </CardContent>
        </Card>
      </DiscountCodeFormSection>

      <DiscountCodeFormSection>
        <Card
          variant="outlined"
          css={{ overflow: 'initial' }}
        >
          <CardContent>
            <FormControl
              fullWidth
              sx={{ marginBottom: 3 }}
            >
              <FormLabel>
                <span id={memberPlanLabelId}>
                  {t('discountCode.form.memberPlan')}
                </span>{' '}
                <InfoTooltip text={t('discountCode.form.memberPlanInfo')} />
              </FormLabel>

              <Controller
                control={control}
                name="memberPlanId"
                render={({ field }) => (
                  <SelectMemberPlan
                    aria-labelledby={memberPlanLabelId}
                    defaultMemberPlan={memberPlan}
                    selectedMemberPlan={field.value}
                    setSelectedMemberPlan={field.onChange}
                  />
                )}
              />
            </FormControl>

            <DateRangeGrid>
              <Controller
                control={control}
                name="validFrom"
                render={({ field, fieldState: { error } }) => (
                  <Box sx={{ marginBottom: 3 }}>
                    <DateTimePicker
                      label={t('discountCode.form.validFrom')}
                      inputRef={field.ref}
                      dateTime={field.value ? new Date(field.value) : undefined}
                      changeDate={(date: Date) =>
                        field.onChange(date?.toISOString())
                      }
                      helperText={error?.message}
                    />
                  </Box>
                )}
              />

              <Controller
                control={control}
                name="validTo"
                render={({ field, fieldState: { error } }) => (
                  <Box sx={{ marginBottom: 3 }}>
                    <DateTimePicker
                      label={t('discountCode.form.validTo')}
                      inputRef={field.ref}
                      dateTime={field.value ? new Date(field.value) : undefined}
                      changeDate={(date: Date) =>
                        field.onChange(date?.toISOString())
                      }
                      helperText={error?.message}
                    />
                  </Box>
                )}
              />
            </DateRangeGrid>
          </CardContent>
        </Card>
      </DiscountCodeFormSection>
    </DiscountCodeFormWrapper>
  );
};
