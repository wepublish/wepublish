import { CustomFieldRender, FieldLabel } from '@measured/puck';
import {
  SelectChangeEvent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  FullMemberPlanFragment,
  useMemberPlanListQuery,
} from '@wepublish/website/api';
import { useId } from 'react';

export const MemberPlanField: CustomFieldRender<
  FullMemberPlanFragment | undefined
> = ({ name, onChange, value, field }) => {
  const { data } = useMemberPlanListQuery({
    variables: {
      take: 50,
      filter: {
        active: true,
      },
    },
  });
  const id = useId();

  const handleChange = (event: SelectChangeEvent) => {
    onChange(
      data?.memberPlans.nodes.find(
        memberPlan => memberPlan.id === event.target.value
      )
    );
  };

  return (
    <FieldLabel label={field.label ?? name}>
      <FormControl fullWidth>
        <InputLabel id={id}>{field.label ?? name}</InputLabel>

        <Select
          labelId={id}
          value={value?.id}
          onChange={handleChange}
          name={name}
        >
          {data?.memberPlans.nodes.map(memberPlan => (
            <MenuItem
              key={memberPlan.id}
              value={memberPlan.id}
            >
              {memberPlan.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </FieldLabel>
  );
};
