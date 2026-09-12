import { captureException } from '@sentry/nextjs';
import {
  Component,
  ComponentType,
  createElement,
  ErrorInfo,
  ReactNode,
} from 'react';

type HideOnErrorProps = {
  children: ReactNode;
  onError?: (error: Error) => void;
};

type HideOnErrorState = {
  hasError: boolean;
};

export class HideOnError extends Component<HideOnErrorProps, HideOnErrorState> {
  override state: HideOnErrorState = { hasError: false };

  static getDerivedStateFromError(): HideOnErrorState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    captureException(error, {
      contexts: { react: { componentStack: info.componentStack } },
    });
    this.props.onError?.(error);
  }

  override render() {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}

export const withHideOnError = <P extends object>(
  ControlledComponent: ComponentType<P>,
  onError?: (error: Error) => void
) => {
  const WithHideOnError = (props: P) => (
    <HideOnError onError={onError}>
      {createElement(ControlledComponent, props)}
    </HideOnError>
  );

  WithHideOnError.displayName = `withHideOnError(${
    ControlledComponent.displayName ?? ControlledComponent.name ?? 'Component'
  })`;

  return WithHideOnError;
};
