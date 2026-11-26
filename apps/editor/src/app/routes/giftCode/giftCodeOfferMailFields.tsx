import { useQuery } from '@apollo/client/react';
import { MailTemplateDocument } from '@wepublish/editor/api';
import { bindComponent, editorForm, SelectField } from '@wepublish/form/editor';
import {
  formatTemplateLabel,
  TemplateAttachmentsNote,
  useLetterChannel,
} from '@wepublish/membership/editor';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import {
  type GiftCodeOfferFormValues,
  giftCodeOfferSchema,
} from './giftCodeOffer.schema';

const { Field } = editorForm.fieldsFor(giftCodeOfferSchema);

const MailTemplateSelect = bindComponent(SelectField);

type MailField = 'purchaseMailTemplateId' | 'redemptionMailTemplateId';

export function GiftCodeOfferMailFields() {
  const { t } = useTranslation();
  const { data } = useQuery(MailTemplateDocument);
  const templates = data?.mailTemplates ?? [];

  const templateOptions = (chosen: string | null | undefined) => [
    ...templates.map(template => ({
      value: template.id,
      label: formatTemplateLabel(
        template.name,
        template.context,
        (key, fallback) => t(key, { defaultValue: fallback })
      ),
    })),
    // A template the list did not return (not loaded yet, or no permission
    // to read templates) still shows instead of looking unset.
    ...(chosen && !templates.some(({ id }) => id === chosen) ?
      [{ value: chosen, label: chosen }]
    : []),
  ];

  return (
    <>
      <Field
        name="purchaseMailTemplateId"
        component={MailTemplateSelect}
        options={({ purchaseMailTemplateId }: GiftCodeOfferFormValues) =>
          templateOptions(purchaseMailTemplateId)
        }
      />
      <MailAttachments
        name="purchaseMailTemplateId"
        templates={templates}
      />
      <Field
        name="redemptionMailTemplateId"
        component={MailTemplateSelect}
        options={({ redemptionMailTemplateId }: GiftCodeOfferFormValues) =>
          templateOptions(redemptionMailTemplateId)
        }
      />
      <MailAttachments
        name="redemptionMailTemplateId"
        templates={templates}
      />
    </>
  );
}

/**
 * The documents the chosen template attaches, filled in with the code like
 * the mail itself. The api attaches them only with paper letters on, so
 * without them there is nothing to say.
 */
function MailAttachments({
  name,
  templates,
}: {
  name: MailField;
  templates: { id: string; attachmentIds?: string[] | null }[];
}) {
  const { paperLetters } = useLetterChannel();
  const { control } = useFormContext<GiftCodeOfferFormValues>();
  const chosen = useWatch({ control, name });
  const attachmentIds =
    templates.find(({ id }) => id === chosen)?.attachmentIds ?? [];

  return (
    <TemplateAttachmentsNote
      attachmentIds={paperLetters ? attachmentIds : []}
    />
  );
}
