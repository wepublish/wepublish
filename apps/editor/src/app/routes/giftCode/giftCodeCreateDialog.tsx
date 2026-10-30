import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import {
  CreateGiftCodesDocument,
  GiftCodeOfferListDocument,
} from '@wepublish/editor/api';
import { enqueueSnackbar, humanizeError } from '@wepublish/ui/editor';
import { TFunction } from 'i18next';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdContentCopy } from 'react-icons/md';
import { z } from 'zod';

const MAX_COUNT = 500;
const RECIPIENT_NAME_MAX_LENGTH = 200;

const createSchema = (t: TFunction) => {
  const countInvalid = t('giftCode.create.countInvalid', { max: MAX_COUNT });

  return z.object({
    offerId: z.string().min(1, t('giftCode.create.offerRequired')),
    count: z
      .number({ invalid_type_error: countInvalid })
      .int(countInvalid)
      .min(1, countInvalid)
      .max(MAX_COUNT, countInvalid),
    recipientName: z.string().max(
      RECIPIENT_NAME_MAX_LENGTH,
      t('giftCode.create.recipientNameTooLong', {
        max: RECIPIENT_NAME_MAX_LENGTH,
      })
    ),
  });
};

type CreateGiftCodesFormValues = z.infer<ReturnType<typeof createSchema>>;

const EMPTY_VALUES: CreateGiftCodesFormValues = {
  offerId: '',
  count: 1,
  recipientName: '',
};

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
  const schema = useMemo(() => createSchema(t), [t]);

  const { control, handleSubmit, reset } = useForm<CreateGiftCodesFormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_VALUES,
  });

  const { data: offerData } = useQuery(GiftCodeOfferListDocument, {
    variables: { take: 100 },
    skip: !open,
  });

  const [createGiftCodes, { loading }] = useMutation(CreateGiftCodesDocument, {
    onError: error =>
      enqueueSnackbar(humanizeError(error), {
        variant: 'error',
        autoHideDuration: 8000,
      }),
    onCompleted: data => {
      setCreatedCodes(
        data.createGiftCodes.flatMap(giftCode =>
          giftCode.code ? [giftCode.code] : []
        )
      );
      onCreated();
    },
  });

  const close = () => {
    onClose();
    setCreatedCodes(undefined);
    reset(EMPTY_VALUES);
  };

  const copy = async () => {
    await navigator.clipboard.writeText((createdCodes ?? []).join('\n'));
    enqueueSnackbar(t('giftCode.create.copied'), { variant: 'success' });
  };

  const submit = handleSubmit(({ offerId, count, recipientName }) =>
    createGiftCodes({
      variables: {
        offerId,
        count,
        recipientName: recipientName.trim() || null,
      },
    }).catch(() => undefined)
  );

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
      : <form
          noValidate
          onSubmit={submit}
        >
          <DialogContent>
            <Stack spacing={2}>
              <DialogContentText>{t('giftCode.create.body')}</DialogContentText>

              <Controller
                name="offerId"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    select
                    required
                    fullWidth
                    label={t('giftCode.create.offer')}
                    error={!!error}
                    helperText={error?.message}
                  >
                    {(offerData?.giftCodeOffers.nodes ?? []).map(offer => (
                      <MenuItem
                        key={offer.id}
                        value={offer.id}
                      >
                        {offer.name}
                        {!offer.active &&
                          ` (${t('giftCode.create.inactiveOffer')})`}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />

              <Controller
                name="count"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    value={Number.isNaN(field.value) ? '' : field.value}
                    onChange={event =>
                      field.onChange(
                        event.target.value === '' ?
                          NaN
                        : Number(event.target.value)
                      )
                    }
                    type="number"
                    required
                    fullWidth
                    label={t('giftCode.create.count')}
                    error={!!error}
                    helperText={
                      error?.message ??
                      t('giftCode.create.countHelp', { max: MAX_COUNT })
                    }
                    slotProps={{ htmlInput: { min: 1, max: MAX_COUNT } }}
                  />
                )}
              />

              <Controller
                name="recipientName"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label={t('giftCode.create.recipientName')}
                    error={!!error}
                    helperText={
                      error?.message ?? t('giftCode.create.recipientNameHelp')
                    }
                  />
                )}
              />
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button
              variant="text"
              onClick={close}
            >
              {t('cancel')}
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {t('giftCode.create.submit')}
            </Button>
          </DialogActions>
        </form>
      }
    </Dialog>
  );
}
