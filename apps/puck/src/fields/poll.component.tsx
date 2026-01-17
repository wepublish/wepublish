import { CustomFieldRender, FieldLabel } from '@puckeditor/core';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { FullPollFragment } from '@wepublish/website/api';
import { useId } from 'react';

export const PollField: CustomFieldRender<FullPollFragment | undefined> = ({
  name,
  onChange,
  value,
  field,
}) => {
  const { data } = usePollListQuery();
  const id = useId();

  const handleChange = (event: SelectChangeEvent) => {
    onChange(data?.polls.nodes.find(poll => poll.id === event.target.value));
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
          {data?.polls.nodes.map(poll => (
            <MenuItem
              key={poll.id}
              value={poll.id}
            >
              {poll.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </FieldLabel>
  );
};
