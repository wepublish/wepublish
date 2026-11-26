import { Page, Response } from '@playwright/test';

/**
 * Waits for the browser's answer to a GraphQL operation, by its operation
 * name. The website batches requests (`BatchHttpLink`), so the name is
 * searched in the body rather than parsed from it.
 */
export const waitForOperation = (
  page: Page,
  operationName: string
): Promise<Response> =>
  page.waitForResponse(response => {
    const request = response.request();
    const sent = request.postData() ?? request.url();

    return (
      sent.includes(`"operationName":"${operationName}"`) ||
      sent.includes(`operationName=${operationName}`)
    );
  });
