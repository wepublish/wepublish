import { CustomFieldRender, FieldLabel } from '@measured/puck';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { RenderRichtext } from '@wepublish/richtext/website';
import {
  FullCommentFragment,
  useCommentListQuery,
} from '@wepublish/website/api';
import { useId } from 'react';

export const CommentField: CustomFieldRender<
  FullCommentFragment | undefined
> = ({ name, onChange, value, field }) => {
  const { data } = useCommentListQuery({
    variables: {
      itemId: '1234',
    },
  });
  const id = useId();

  const handleChange = (event: SelectChangeEvent) => {
    onChange(data?.comments.find(comment => comment.id === event.target.value));
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
          {data?.comments.map(comment => (
            <MenuItem
              key={comment.id}
              value={comment.id}
            >
              <RenderRichtext elements={comment.text ?? []} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </FieldLabel>
  );
};
