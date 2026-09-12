import { Alert, AlertProps } from '@mui/material';
import { captureException } from '@sentry/nextjs';
import {
  Component,
  ComponentType,
  createElement,
  ErrorInfo,
  ReactNode,
} from 'react';

import { translateApolloErrorMessage } from './api-alert';

type ShowErrorAlertProps = {
  children: ReactNode;
  onError?: (error: Error) => void;
  alertProps?: Omit<AlertProps, 'children'>;
};

type ShowErrorAlertState = {
  error?: Error;
};

export class ShowErrorAlert extends Component<
  ShowErrorAlertProps,
  ShowErrorAlertState
> {
  override state: ShowErrorAlertState = {};

  static getDerivedStateFromError(error: Error): ShowErrorAlertState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    captureException(error, {
      contexts: { react: { componentStack: info.componentStack } },
    });
    this.props.onError?.(error);
  }

  override render() {
    if (this.state.error) {
      return (
        <Alert
          severity="error"
          {...this.props.alertProps}
        >
          {translateApolloErrorMessage(this.state.error.message)}
        </Alert>
      );
    }

    return this.props.children;
  }
}

export const withShowErrorAlert = <P extends object>(
  ControlledComponent: ComponentType<P>,
  options?: Omit<ShowErrorAlertProps, 'children'>
) => {
  const WithShowErrorAlert = (props: P) => (
    <ShowErrorAlert {...options}>
      {createElement(ControlledComponent, props)}
    </ShowErrorAlert>
  );

  WithShowErrorAlert.displayName = `withShowErrorAlert(${
    ControlledComponent.displayName ?? ControlledComponent.name ?? 'Component'
  })`;

  return WithShowErrorAlert;
};
