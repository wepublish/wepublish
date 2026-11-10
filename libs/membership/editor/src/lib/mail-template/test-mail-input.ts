import {
  MailTemplatePreviewInput,
  SendTestMailTemplateInput,
} from '@wepublish/editor/api';

/**
 * The test mail is the mail preview sent to the editor: it takes the same
 * fields, attachments included, except the letter stationery, which the API
 * would reject.
 */
export const testMailInput = ({
  contextId,
  subscriptionId,
  subject,
  htmlContent,
  textContent,
  attachmentIds,
}: MailTemplatePreviewInput): SendTestMailTemplateInput => ({
  contextId,
  subscriptionId,
  subject,
  htmlContent,
  textContent,
  attachmentIds,
});
