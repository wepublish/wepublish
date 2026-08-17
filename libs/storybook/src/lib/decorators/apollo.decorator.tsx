import {
  MockedProvider as DefaultMockedProvider,
  MockedResponse,
} from '@apollo/client/testing';
import { Decorator } from '@storybook/react';
import { print } from 'graphql';
import { useEffect } from 'react';
import { addons } from 'storybook/internal/preview-api';
import { ApolloClientAddonState, EVENTS } from 'storybook-addon-apollo-client';

const getMockName = (mockedResponse: MockedResponse) => {
  if (mockedResponse.request.operationName) {
    return mockedResponse.request.operationName;
  }

  const operationDefinition = mockedResponse.request.query.definitions.find(
    definition => definition.kind === 'OperationDefinition'
  );

  if (operationDefinition?.name) {
    return operationDefinition.name.value;
  }

  return `Unnamed`;
};

function stringifyOrUndefined(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return undefined;
  }
}

function createResultFromMocks(
  mocks: MockedResponse[],
  activeIndex: number
): ApolloClientAddonState {
  const mock = mocks[activeIndex];

  if (!mock) {
    return {
      activeIndex: -1,
      options: mocks.map(getMockName),
    };
  }

  return {
    options: mocks.map(getMockName),
    activeIndex,
    query: print(mock.request.query),
    variables: stringifyOrUndefined(mock.request.variables),
    extensions: stringifyOrUndefined(mock.request.extensions),
    context: stringifyOrUndefined(mock.request.context),
    result: stringifyOrUndefined(mock.result),
    error: stringifyOrUndefined(mock.error),
  };
}

export const WithApolloClientDecorator: Decorator = (Story, context) => {
  const apolloClient = context.parameters.apolloClient;

  useEffect(() => {
    const { mocks = [] } = apolloClient || {};
    const channel = addons.getChannel();

    const handleRequest = (activeIndex: number) => {
      channel.emit(EVENTS.RESULT, createResultFromMocks(mocks, activeIndex));
    };

    handleRequest(mocks.length ? 0 : -1);
    channel.on(EVENTS.REQUEST, handleRequest);

    return () => {
      channel.off(EVENTS.REQUEST, handleRequest);
    };
  }, [apolloClient]);

  if (!apolloClient) {
    return <Story />;
  }

  const { MockedProvider = DefaultMockedProvider, ...providerProps } =
    apolloClient;

  return (
    <MockedProvider {...providerProps}>
      <Story />
    </MockedProvider>
  );
};
