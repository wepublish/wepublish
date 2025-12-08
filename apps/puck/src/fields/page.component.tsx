import { CustomFieldRender, FieldLabel } from '@measured/puck';
import {
  SelectChangeEvent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  PageWithoutBlocksFragment,
  usePageListQuery,
} from '@wepublish/website/api';
import { useId } from 'react';

export const PageField: CustomFieldRender<
  PageWithoutBlocksFragment | undefined
> = ({ name, onChange, value, field }) => {
  const { data } = usePageListQuery({});
  const id = useId();

  const handleChange = (event: SelectChangeEvent) => {
    onChange(data?.pages.nodes.find(page => page.id === event.target.value));
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
          {data?.pages.nodes.map(page => (
            <MenuItem
              key={page.id}
              value={page.id}
            >
              {page.latest.title}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </FieldLabel>
  );
};
