import { ComponentData, Data } from '@puckeditor/core';
import { z } from 'zod/v4';

import {
  blockVisibilitySchema,
  datasourcesSchema,
  rootMetadataSchema,
} from '@wepublish/puck-content/editor';

const blockDataSchema = z
  .object({
    type: z.string(),
  })
  .catchall(z.json());

export type ApiBlock = {
  id: string;
  visibility: z.infer<typeof blockVisibilitySchema>;
  datasources: z.infer<typeof datasourcesSchema>;
  data: z.infer<typeof blockDataSchema>;
  children?: ApiBlock[];
};

export const apiBlockSchema: z.ZodType<ApiBlock> = z.object({
  id: z.guid(),
  visibility: blockVisibilitySchema,
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
  blocks.map(
    ({ id, visibility, datasources, data: { type, ...props }, children }) => ({
      type,
      props: {
        ...props,
        ...(children ? toChildProps(type, children) : {}),
        id,
        visibility,
        datasources,
      },
    })
  );

const withoutNulls = (value: unknown) =>
  value && typeof value === 'object' ?
    Object.fromEntries(
      Object.entries(value).filter(([, entry]) => entry !== null)
    )
  : value;

export const toPuckRootProps = (metadata: unknown = {}) =>
  rootMetadataSchema.partial().parse(withoutNulls(metadata));

export const toPuckData = (blocks: unknown, metadata?: unknown): Data => ({
  root: { props: toPuckRootProps(metadata) },
  content: toPuckContent(apiBlocksSchema.parse(blocks)),
});
