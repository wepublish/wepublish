import { PuckComponent } from '@puckeditor/core';
import { SubscribeBlockProvider } from '@wepublish/block-content/website';
import {
  BuilderSubscribeBlockProps,
  SubscribeBlock,
} from '@wepublish/website/builder';

import { DatasourceValueType } from '@wepublish/puck-content/editor';

export type SubscribeConfigProps = BuilderSubscribeBlockProps & {
  datasource?: DatasourceValueType<'items'>;
};

export const SubscribeRender: PuckComponent<SubscribeConfigProps> = props => (
  <SubscribeBlockProvider>
    <SubscribeBlock {...props} />
  </SubscribeBlockProvider>
);
