import { Config } from '@puckeditor/core';

import { AlignmentField } from './alignment/alignment.field';
import { ApiField } from './api/api.field';
import { BorderField } from './border/border.field';
import { BreakpointsField } from './breakpoints/breakpoints.field';
import { ColorField } from './color/color.field';
import { ColumnsField } from './columns/columns.field';
import { DatasourceField } from './datasource/datasource.field';
import { ImageField } from './image/image.field';
import { ListField } from './list/list.field';
import { PaddingField } from './padding/padding.field';
import { PaletteField } from './palette/palette.field';
import { ResolvedField } from './resolved';
import { RichtextField } from './richtext/richtext.field';
import { VisibilityField } from './visibility/visibility.field';
import { SwitchField } from './switch/switch.field';
import { TagField } from './tag/tag.field';
import { TypographyField } from './typography/typography.field';

export type UserFields = {
  api: ApiField;
  datasource: DatasourceField;
  padding: PaddingField;
  border: BorderField;
  breakpoints: BreakpointsField;
  columns: ColumnsField;
  list: ListField;
  tag: TagField;
  alignment: AlignmentField;
  palette: PaletteField;
  richtext: RichtextField;
  color: ColorField;
  typography: TypographyField;
  switch: SwitchField;
  image: ImageField;
  visibility: VisibilityField;
  resolved: ResolvedField;
};

export type UserFieldsConfig = Config<{ fields: UserFields }>;
