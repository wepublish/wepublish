import { TagType, PrismaClient } from '@prisma/client';
import { authorise } from '../permissions';
import {
  CanCreateTag,
  CanDeleteTag,
  CanUpdateTag,
} from '@wepublish/permissions';
import { Context } from '../../context';
import { Descendant } from 'slate';

export const createTag = (
  tag: string,
  description: Descendant[],
  type: TagType,
  main = false,
  bgColor: string | null = null,
  authenticate: Context['authenticate'],
  tagClient: PrismaClient['tag']
) => {
  const { roles } = authenticate();
  authorise(CanCreateTag, roles);

  return tagClient.create({
    data: {
      tag,
      type,
      description: description as any[],
      main,
      bgColor,
    },
  });
};

export const deleteTag = (
  tagId: string,
  authenticate: Context['authenticate'],
  tagClient: PrismaClient['tag']
) => {
  const { roles } = authenticate();
  authorise(CanDeleteTag, roles);

  return tagClient.delete({
    where: {
      id: tagId,
    },
  });
};

export const updateTag = (
  tagId: string,
  tag: string,
  description: Descendant[],
  main: boolean | undefined,
  bgColor: string | null = null,
  authenticate: Context['authenticate'],
  tagClient: PrismaClient['tag']
) => {
  const { roles } = authenticate();
  authorise(CanUpdateTag, roles);

  return tagClient.update({
    where: {
      id: tagId,
    },
    data: {
      tag,
      main,
      description: description as any[],
      bgColor,
    },
  });
};
