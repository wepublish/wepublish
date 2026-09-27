import { enrichTemplateData, renderTemplate } from '@wepublish/template/api';

export * from '@wepublish/template/api';

export interface MailTemplateContent {
  subject: string;
  htmlContent: string;
  textContent?: string | null;
}

export interface ComposedMail {
  subject: string;
  messageHtml: string;
  message?: string;
}

/**
 * Compose a fully-rendered mail (subject, html and optional text) from a local
 * template and the mail data. Raw fields, computed fields (money/totals) and
 * date-format variants are all available as `{{key}}` placeholders.
 */
export function composeMail(
  template: MailTemplateContent,
  data: Record<string, any>
): ComposedMail {
  const enriched = enrichTemplateData(data);

  return {
    subject: renderTemplate(template.subject, enriched),
    messageHtml: renderTemplate(template.htmlContent, enriched),
    message:
      template.textContent ?
        renderTemplate(template.textContent, enriched)
      : undefined,
  };
}
