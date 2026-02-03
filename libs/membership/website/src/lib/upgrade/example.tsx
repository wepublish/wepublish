import { zodResolver } from '@hookform/resolvers/zod';

import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, TextField } from '@mui/material';

const validationSchema = z.object({
  v0: z.object({
    apiKey: z.string().optional(),
    systemPromp: z.string().optional(),
  }),
  mailChimp: z.object({
    apiKey: z.string().optional(),
    region: z.string().optional(),
  }),
});

export const Example = () => {
  const { control, handleSubmit } = useForm<z.infer<typeof validationSchema>>({
    resolver: zodResolver(validationSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

  const onSubmit = handleSubmit(console.info, console.warn);

  return (
    <form
      onSubmit={onSubmit}
      noValidate
    >
      {/* if you split these up into smaller components, pass down control */}
      <div>
        <Controller
          name={'v0.apiKey'}
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />

        <Controller
          name={'v0.systemPromp'}
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              multiline
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
      </div>

      <div>
        <Controller
          name={'mailChimp.apiKey'}
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />

        <Controller
          name={'mailChimp.region'}
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
      </div>

      <Button
        size={'large'}
        type="submit"
      >
        Submit
      </Button>
    </form>
  );
};
