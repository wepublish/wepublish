import { ApolloLink, DefaultContext } from '@apollo/client';

export const PREVIEW_MODE_KEY = 'PREVIEW_MODE';

export const previewLink = new ApolloLink((operation, forward) => {
  const isPreview = !!Number(sessionStorage.getItem(PREVIEW_MODE_KEY));

  operation.setContext((context: DefaultContext) => ({
    ...context,
    headers: {
      ...context.headers,
      preview: isPreview ? `preview` : '',
    },
  }));

  return forward(operation);
});
