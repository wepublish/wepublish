import { ComponentProps, ReactNode } from 'react';

import {
  Actions,
  Header,
  HeadingRow,
  HeadingText,
  PuckPanel,
  Subtitle,
  Title,
} from './plugin-panel-header.styles';

export type PluginPanelHeaderProps = Omit<ComponentProps<'div'>, 'title'> & {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
};

export const PluginPanelHeader = ({
  title,
  subtitle,
  actions,
  children,
  ...props
}: PluginPanelHeaderProps) => (
  <Header
    data-plugin-panel-header
    {...props}
  >
    {(title || actions) && (
      <HeadingRow>
        <HeadingText>
          {title && <Title>{title}</Title>}
          {subtitle && <Subtitle>{subtitle}</Subtitle>}
        </HeadingText>

        {actions && <Actions>{actions}</Actions>}
      </HeadingRow>
    )}

    {children}
  </Header>
);

export const PuckPluginPanel = (props: ComponentProps<'div'>) => (
  <PuckPanel {...props} />
);
