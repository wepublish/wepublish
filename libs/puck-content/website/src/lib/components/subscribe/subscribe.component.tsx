import { PuckComponent } from '@puckeditor/core';
import { SubscribeBlockProvider } from '@wepublish/block-content/website';
import {
  BuilderSubscribeBlockProps,
  SubscribeBlock,
} from '@wepublish/website/builder';

import { DatasourcesValue } from '@wepublish/puck-content/editor';

export type SubscribeConfigProps = BuilderSubscribeBlockProps & {
  datasources: DatasourcesValue;
};

export const SubscribeRender: PuckComponent<SubscribeConfigProps> = props => (
  <SubscribeBlockProvider>
    <SubscribeBlock {...props} />
  </SubscribeBlockProvider>
);
