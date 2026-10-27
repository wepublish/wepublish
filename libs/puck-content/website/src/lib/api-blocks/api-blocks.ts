import { ComponentData, Data } from '@puckeditor/core';
import { z } from 'zod/v4';

import { datasourcesSchema } from '@wepublish/puck-content/editor';

const blockDataSchema = z
  .object({
    type: z.string(),
  })
  .catchall(z.json());

export type ApiBlock = {
  id: string;
  datasources: z.infer<typeof datasourcesSchema>;
  data: z.infer<typeof blockDataSchema>;
  children?: ApiBlock[];
};

export const apiBlockSchema: z.ZodType<ApiBlock> = z.object({
  id: z.guid(),
  datasources: datasourcesSchema,
  data: blockDataSchema,
  get children() {
    return z.array(apiBlockSchema).optional();
  },
});

export const apiBlocksSchema = z.array(apiBlockSchema);

const toChildProps = (type: string, children: ApiBlock[]) =>
  type === 'Slider' ?
    {
      items: children.map(child => ({ content: toPuckContent([child]) })),
    }
  : { content: toPuckContent(children) };

export const toPuckContent = (blocks: ApiBlock[]): ComponentData[] =>
  blocks.map(({ id, datasources, data: { type, ...props }, children }) => ({
    type,
    props: {
      ...props,
      ...(children ? toChildProps(type, children) : {}),
      id,
      datasources,
    },
  }));

export const toPuckData = (blocks: unknown): Data => ({
  root: { props: {} },
  content: toPuckContent(apiBlocksSchema.parse(blocks)),
});
