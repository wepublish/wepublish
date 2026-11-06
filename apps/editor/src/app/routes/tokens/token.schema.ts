import type { CreateTokenMutationVariables } from '@wepublish/editor/api';
import type { FormOutput } from '@wepublish/form/editor';
import { z } from 'zod/v4';

export const tokenSchema = z.object({
  name: z.string().min(1).meta({ label: 'tokenList.panels.name' }),
});

export const toCreateTokenVariables = ({
  name,
}: FormOutput<typeof tokenSchema>): CreateTokenMutationVariables => ({
  name,
});
