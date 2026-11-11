import {
  MailTemplatePreviewInput,
  SendTestMailTemplateInput,
} from '@wepublish/editor/api';

/**
 * The test mail is the mail preview sent to the editor: it takes the same
 * fields except the letter stationery, which the API would reject.
 */
export const testMailInput = ({
  contextId,
  subscriptionId,
  subject,
  htmlContent,
  textContent,
}: MailTemplatePreviewInput): SendTestMailTemplateInput => ({
  contextId,
  subscriptionId,
  subject,
  htmlContent,
  textContent,
});
