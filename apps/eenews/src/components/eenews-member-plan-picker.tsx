import styled from '@emotion/styled';
import { RadioGroup } from '@mui/material';
import {
  BuilderMemberPlanPickerProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

const Grid = styled(RadioGroup)`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  ${({ theme }) => theme.breakpoints.down('md')} {
    grid-template-columns: 1fr;
  }
`;

export const EenewsMemberPlanPicker = ({
  className,
  memberPlans,
  onChange,
  name,
  value,
}: BuilderMemberPlanPickerProps) => {
  const { MemberPlanItem } = useWebsiteBuilder();

  return (
    <Grid
      className={className}
      name={name}
      value={value ?? ''}
      onChange={(_, v) => onChange(v)}
    >
      {memberPlans.map(plan => (
        <MemberPlanItem
          key={plan.id}
          value={plan.id}
          slug={plan.slug}
          amountPerMonthMin={plan.amountPerMonthMin}
          amountPerMonthMax={plan.amountPerMonthMax ?? undefined}
          currency={plan.currency}
          extendable={plan.extendable}
          shortDescription={plan.shortDescription}
          tags={plan.tags}
          checked={plan.id === value}
        />
      ))}
    </Grid>
  );
};
