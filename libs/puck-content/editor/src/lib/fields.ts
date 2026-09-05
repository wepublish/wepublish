import { Config } from '@puckeditor/core';

import { AlignmentField } from './alignment';
import { BorderField } from './border';
import { ColorField } from './color/color';
import { ColumnsField } from './columns';
import { DatasourceField } from './datasource';
import { PaddingField } from './padding';
import { PaletteField } from './palette';
import { ResolvedField } from './resolved';
import { RichtextField } from './richtext';
import { SEOField } from './seo';

export type UserFields = {
  datasource: DatasourceField;
  seo: SEOField;
  padding: PaddingField;
  border: BorderField;
  columns: ColumnsField;
  alignment: AlignmentField;
  palette: PaletteField;
  richtext: RichtextField;
  color: ColorField;
  resolved: ResolvedField;
};

export type UserFieldsConfig = Config<{ fields: UserFields }>;
