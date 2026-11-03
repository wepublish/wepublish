import type { IconType } from 'react-icons';

import type { Components } from '../config.types';
import type { BlockCategoryId, BlockGroupId } from './block-library.catalog';

export type BlockName = Extract<keyof Components, string>;

export type BlockNameKey = `puck.blocks.names.${BlockName}`;

declare module '@puckeditor/core' {
  interface ComponentConfigExtensions {
    icon?: IconType;
    category?: BlockCategoryId;
    group?: BlockGroupId;
    order?: number;
    nameKey?: BlockNameKey;
    hidden?: boolean;
  }
}
