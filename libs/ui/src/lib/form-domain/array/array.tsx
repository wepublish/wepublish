import { Box } from '@mui/material';

import { Button } from '../../button/button';
import { MdDelete } from 'react-icons/md';
import { IconButton } from '../../icon-button/icon-button';
import { ComponentProps, memo } from 'react';
import { SubForm } from './sub-form';
import { InputComponentProps } from '@wepublish/website/form-builder';
import styled from '@emotion/styled';
import * as v from 'valibot';
import { useFieldArray, useFormContext } from 'react-hook-form';

const ArrayInputWrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  justify-items: start;
`;

export const ArrayInput = memo(
  <T extends object>({
    field,
    fieldState,
    description,
    name,
    schema,
    title,
    getSubFormProps,
    getDefaultItem,
  }: {
    getDefaultItem?: () => T;
    getSubFormProps?: (item: T) => Partial<ComponentProps<typeof SubForm>>;
  } & InputComponentProps<v.ArraySchema<any, any>>) => {
    const form = useFormContext();
    const { append, remove } = useFieldArray({
      control: form.control,
      name,
    });

    return (
      <ArrayInputWrapper ref={field.ref}>
        <Button onClick={() => append(getDefaultItem?.())}>+</Button>

        {field.value?.map((item, index) => (
          <Box
            key={index}
            sx={{
              display: 'grid',
              gap: 2,
              gridAutoFlow: 'column',
              gridAutoColumns: 'auto',
              alignItems: 'center',
            }}
          >
            <SubForm
              schema={schema.item}
              defaultValues={item}
              {...getSubFormProps?.(item)}
              index={index}
            />

            <IconButton
              color="error"
              onClick={() => remove(index)}
            >
              <MdDelete />
            </IconButton>
          </Box>
        ))}
      </ArrayInputWrapper>
    );
  }
);
