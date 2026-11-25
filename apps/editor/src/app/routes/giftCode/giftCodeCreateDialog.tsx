import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
} from '@mui/material';
import {
  CreateGiftCodesDocument,
  GiftCodeOfferListDocument,
} from '@wepublish/editor/api';
import {
  bindComponent,
  editorForm,
  FormErrorSummary,
  SelectField,
  useFormStatus,
} from '@wepublish/form/editor';
import { enqueueSnackbar } from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdContentCopy } from 'react-icons/md';

import {
  giftCodeCreateSchema,
  toCreateGiftCodesVariables,
} from './giftCodeCreate.schema';

const { Field } = editorForm.fieldsFor(giftCodeCreateSchema);

const OfferSelect = bindComponent(SelectField);

const CodeList = styled.ol`
  margin: 0;
  padding: 12px;
  list-style: none;
  max-height: 320px;
  overflow: auto;
  font-family: monospace;
  border-radius: 4px;
  background: ${({ theme }) => theme.palette.action.hover};
`;

function ServerError() {
  const { serverError } = useFormStatus();

  return serverError === undefined ? null : (
      <Alert severity="error">{serverError}</Alert>
    );
}

function SubmitButton() {
  const { t } = useTranslation();
  const { isSubmitting } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="contained"
      disabled={isSubmitting}
    >
      {t('giftCode.create.submit')}
    </Button>
  );
}

type GiftCodeCreateFormProps = {
  onCancel(): void;
  onCreated(codes: string[]): void;
};

function GiftCodeCreateForm({ onCancel, onCreated }: GiftCodeCreateFormProps) {
  const { t } = useTranslation();
  const handle = editorForm.useSchemaForm(giftCodeCreateSchema);
  const { data: offerData } = useQuery(GiftCodeOfferListDocument, {
    variables: { take: 100 },
  });
  const [createGiftCodes] = useMutation(CreateGiftCodesDocument);

  const offerOptions = (offerData?.giftCodeOffers.nodes ?? []).map(offer => ({
    value: offer.id,
    label:
      offer.active ?
        offer.name
      : `${offer.name} (${t('giftCode.create.inactiveOffer')})`,
  }));

  return (
    <editorForm.Form
      form={handle}
      id="giftCodeCreate"
      onSubmit={async values => {
        const { data } = await createGiftCodes({
          variables: toCreateGiftCodesVariables(values),
        });

        onCreated(
          (data?.createGiftCodes ?? []).flatMap(giftCode =>
            giftCode.code ? [giftCode.code] : []
          )
        );
      }}
    >
      <DialogContent>
        <Stack spacing={2}>
          <DialogContentText>{t('giftCode.create.body')}</DialogContentText>

          <FormErrorSummary />
          <ServerError />

          <Field
            name="offerId"
            component={OfferSelect}
            options={offerOptions}
          />
          <Field name="count" />
          <Field name="recipientName" />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button
          variant="text"
          onClick={onCancel}
        >
          {t('cancel')}
        </Button>

        <SubmitButton />
      </DialogActions>
    </editorForm.Form>
  );
}

type GiftCodeCreateDialogProps = {
  open: boolean;
  onClose(): void;
  onCreated(): void;
};

export function GiftCodeCreateDialog({
  open,
  onClose,
  onCreated,
}: GiftCodeCreateDialogProps) {
  const { t } = useTranslation();
  const [createdCodes, setCreatedCodes] = useState<string[]>();

  const close = () => {
    onClose();
    setCreatedCodes(undefined);
  };

  const copy = async () => {
    await navigator.clipboard.writeText((createdCodes ?? []).join('\n'));
    enqueueSnackbar(t('giftCode.create.copied'), { variant: 'success' });
  };

  return (
    <Dialog
      fullWidth
      open={open}
      maxWidth="sm"
      onClose={close}
    >
      <DialogTitle>
        {createdCodes ?
          t('giftCode.create.createdTitle', { count: createdCodes.length })
        : t('giftCode.create.title')}
      </DialogTitle>

      {createdCodes ?
        <>
          <DialogContent>
            <Stack spacing={2}>
              <DialogContentText>
                {t('giftCode.create.createdBody')}
              </DialogContentText>

              <CodeList>
                {createdCodes.map(code => (
                  <li key={code}>{code}</li>
                ))}
              </CodeList>
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button
              variant="text"
              startIcon={<MdContentCopy />}
              onClick={copy}
            >
              {t('giftCode.create.copy')}
            </Button>

            <Button
              variant="contained"
              onClick={close}
            >
              {t('giftCode.create.close')}
            </Button>
          </DialogActions>
        </>
      : <GiftCodeCreateForm
          onCancel={close}
          onCreated={codes => {
            setCreatedCodes(codes);
            onCreated();
          }}
        />
      }
    </Dialog>
  );
}
