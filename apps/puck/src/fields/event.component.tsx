import { CustomFieldRender, FieldLabel } from '@measured/puck';
import {
  SelectChangeEvent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { FullEventFragment, useEventListQuery } from '@wepublish/website/api';
import { useId } from 'react';

export const EventField: CustomFieldRender<FullEventFragment | undefined> = ({
  name,
  onChange,
  value,
  field,
}) => {
  const { data } = useEventListQuery({});
  const id = useId();

  const handleChange = (event: SelectChangeEvent) => {
    onChange(data?.events.nodes.find(ev => ev.id === event.target.value));
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
          {data?.events.nodes.map(event => (
            <MenuItem
              key={event.id}
              value={event.id}
            >
              {event.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </FieldLabel>
  );
};
