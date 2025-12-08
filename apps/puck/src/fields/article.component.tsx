import { CustomFieldRender, FieldLabel } from '@measured/puck';
import {
  SelectChangeEvent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ArticleWithoutBlocksFragment,
  useArticleListQuery,
} from '@wepublish/website/api';
import { useId } from 'react';

export const ArticleField: CustomFieldRender<
  ArticleWithoutBlocksFragment | undefined
> = ({ name, onChange, value, field }) => {
  const { data } = useArticleListQuery({});
  const id = useId();

  const handleChange = (event: SelectChangeEvent) => {
    onChange(
      data?.articles.nodes.find(article => article.id === event.target.value)
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
          {data?.articles.nodes.map(article => (
            <MenuItem
              key={article.id}
              value={article.id}
            >
              {article.latest.title}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </FieldLabel>
  );
};
