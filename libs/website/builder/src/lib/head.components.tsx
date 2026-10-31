import { ComponentProps } from 'react';
import {
  useWebsiteBuilder,
  WebsiteBuilderProps,
} from './website-builder.context';

export type BuilderHeadProps = ComponentProps<WebsiteBuilderProps['Head']>;
export type BuilderScriptProps = ComponentProps<WebsiteBuilderProps['Script']>;

export const Head = (props: BuilderHeadProps) => {
  const { Head } = useWebsiteBuilder();

  return <Head {...props} />;
};

export const Script = (props: BuilderScriptProps) => {
  const { Script } = useWebsiteBuilder();

  return <Script {...props} />;
};
